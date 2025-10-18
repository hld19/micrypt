export namespace main {
	
	export class FileInfo {
	    encryptedName: string;
	    originalName: string;
	    size: number;
	    category: string;
	    // Go type: time
	    encryptedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.encryptedName = source["encryptedName"];
	        this.originalName = source["originalName"];
	        this.size = source["size"];
	        this.category = source["category"];
	        this.encryptedAt = this.convertValues(source["encryptedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class VaultStats {
	    totalFiles: number;
	    totalSize: number;
	    vaultPath: string;
	    isUnlocked: boolean;
	
	    static createFrom(source: any = {}) {
	        return new VaultStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalFiles = source["totalFiles"];
	        this.totalSize = source["totalSize"];
	        this.vaultPath = source["vaultPath"];
	        this.isUnlocked = source["isUnlocked"];
	    }
	}

}

