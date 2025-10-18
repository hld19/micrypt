package crypto

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/binary"
	"errors"
	"sync"
	"time"
)

const (
	MinEntropyEvents   = 500
	MinEntropyDuration = 15 * time.Second
)

type EntropyCollector struct {
	mu     sync.Mutex
	events []byte
	count  int
	start  time.Time
}

func NewEntropyCollector() *EntropyCollector {
	return &EntropyCollector{
		events: make([]byte, 0, MinEntropyEvents*8),
		count:  0,
		start:  time.Now(),
	}
}

func (ec *EntropyCollector) AddEvent(x, y int32, timestamp int64) {
	ec.mu.Lock()
	defer ec.mu.Unlock()

	if ec.count >= MinEntropyEvents {
		return
	}

	buf := make([]byte, 16)
	binary.LittleEndian.PutUint32(buf[0:4], uint32(x))
	binary.LittleEndian.PutUint32(buf[4:8], uint32(y))
	binary.LittleEndian.PutUint64(buf[8:16], uint64(timestamp))

	ec.events = append(ec.events, buf...)
	ec.count++
}

func (ec *EntropyCollector) GetProgress() float64 {
	ec.mu.Lock()
	defer ec.mu.Unlock()

	eventProgress := float64(ec.count) / float64(MinEntropyEvents)
	if eventProgress > 1.0 {
		eventProgress = 1.0
	}

	elapsed := time.Since(ec.start)
	timeProgress := float64(elapsed) / float64(MinEntropyDuration)
	if timeProgress > 1.0 {
		timeProgress = 1.0
	}

	if eventProgress < timeProgress {
		return eventProgress
	}
	return timeProgress
}

func (ec *EntropyCollector) IsComplete() bool {
	ec.mu.Lock()
	defer ec.mu.Unlock()
	return ec.count >= MinEntropyEvents && time.Since(ec.start) >= MinEntropyDuration
}

func (ec *EntropyCollector) GenerateSeed() ([]byte, error) {
	ec.mu.Lock()
	defer ec.mu.Unlock()
	if ec.count < MinEntropyEvents || time.Since(ec.start) < MinEntropyDuration {
		return nil, errors.New("insufficient entropy collected")
	}

	hash := sha256.New()
	hash.Write(ec.events)

	systemRandom := make([]byte, 32)
	if _, err := rand.Read(systemRandom); err != nil {
		return nil, err
	}
	hash.Write(systemRandom)

	return hash.Sum(nil), nil
}

func (ec *EntropyCollector) Reset() {
	ec.mu.Lock()
	defer ec.mu.Unlock()
	ec.events = make([]byte, 0, MinEntropyEvents*8)
	ec.count = 0
	ec.start = time.Now()
}
