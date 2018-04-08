
const LP_TAG_NUMBER = 255;
const LP_TAG_STRING = 256;
const LP_TAG_AR = 260;
const LP_TAG_AL = 261;
const LP_TAG_BY = 262;
const LP_TAG_TI = 263;
const LP_TAG_AU = 264;
const LP_TAG_OFFSET = 265;
const LP_TAG_UNKNOWN = 266;

/// lrcText (string): LRC Lyric to parse in text format
function LRCParser(lrcText) {
	this.text = lrcText;
	this.lexer = new LRCLexer(lrcText);
	this.look = { tag: null, val: null };
	this.lyrics = [];
	this.lyricInfo = { aritist: '', album: '', by: '', offset: 0, title: '', author: '' };
	
	this.forceNextLine = false;
	
	LRCParser.prototype.next = function() {
		this.look = this.lexer.scan();
		console.log(this.look);
		return this.look;
	}
	LRCParser.prototype.match = function(tag, msg) {
		if (this.look.tag != tag) {
			this.forceNextLine = true;
			this.lexer.skipThisLine();
			console.error(msg);
			console.error(this.look);
			return false;
		}
		this.next();
		return true;
	}
	LRCParser.prototype.getLyricTokens = function() {
		let c = null;
		do {
			c = this.lexer.scan(); console.log(c);
		} while (c != null);
	}
	/* *
	Lyric -> Tag string(opt) Lyric | e
    Tag   -> TimeTags | InfoTag
	TimeTags -> TimeTag TimeTags | TimeTag
	TimeTag  -> [ number : number TimeMS(opt) ]
	TimeMS   -> . number
	InfoTag  -> [ keyword : string ]
	 * */
	LRCParser.prototype.getLyric = function() {
		this.next();
		//return 0;
		while (this.look != null) {
			this.forceNextLine = false;
			console.log(this.look);
			if (this.look.tag != '[') {
				this.lexer.skipThisLine();
				continue;
			}
			
			let timePoints = [];
			do {
				this.next(); //consume '['
				// TimeTags
				if (this.look.tag == LP_TAG_NUMBER) {
					let min=this.look.val; this.next();
					if (!this.match(':', ': expected')) continue;
					let sec=this.look.val; this.next();
					let ms = 0;
					if (this.look.tag == '.') {
						// TimeMS
						this.next();
						ms = this.look.val; this.next();
						if (ms < 100) ms *= 10;
						else if (ms >= 1000) {
							ms = 0;
							console.error('ms is greater than 1000');
						}
					}
					timePoints.push( min*60*1000 + sec*1000 + ms );
				}
				else if (this.look.tag >= 260) {
					let tagName = this.look.tag; this.next();
					let val = this.look.val; this.next();
					if (tagName == LP_TAG_AL)      this.lyricInfo.album = val;
					else if (tagName == LP_TAG_AU) this.lyricInfo.author = val;
					else if (tagName == LP_TAG_AR) this.lyricInfo.aritist = val;
					else if (tagName == LP_TAG_TI) this.lyricInfo.title = val;
					else if (tagName == LP_TAG_OFFSET) this.lyricInfo.offset = val;
					else if (tagName == LP_TAG_BY) this.lyricInfo.by = val;
				}
				if (!this.match(']', '] expected')) continue;
			} while (this.look != null && this.look.tag == '[' && !this.forceNextLine);
			console.log(timePoints);
			if (this.look == null) {
				for (let i=0; i<timePoints.length; ++i)
					this.lyrics.push({ time: timePoints[i], lyric: '' });
				break;
			}
			else if (this.look.tag == LP_TAG_STRING) {
				let l = this.look.val; this.next();
				for (let i=0; i<timePoints.length; ++i) {
					this.lyrics.push({ time: timePoints[i], lyric: l });
				}
			}
		}
		for (let i=0; i<this.lyrics.length; i++) {
			this.lyrics[i].time += this.lyricInfo.offset * 500;
		}
		
		this.lyrics.sort(function(a, b) {
			if(a.time < b.time) return -1;
			if(a.time == b.time) return 0;
			return 1;
		});
	}
}

function LRCLexer(lrcText) {
	const FETCH_STATE_BEFORE_TAG = 0;
	const FETCH_STATE_IN_TAG = 1;
	const FETCH_STATE_AFTER_TAG = 2;
	
	this.text = lrcText;
	this.index = 0;
	this.peak = undefined;
	this.fetchState = FETCH_STATE_BEFORE_TAG;
	this.fetchAsString = false;
	
	LRCLexer.prototype.constructor = function() {
		
	}
	LRCLexer.prototype.readch = function() {
		return this.peak = this.text[this.index++];
	}
	LRCLexer.prototype.retract = function() {
		--this.index;
	}
	LRCLexer.prototype.consumeSpaces = function() {
		for (; this.peak == ' ' || this.peak == '\n'; this.readch());
	}
	LRCLexer.prototype.scan = function() {
		if (this.peak == undefined)
			return null;
		if (this.peak == '\n') {
			this.fetchState = FETCH_STATE_BEFORE_TAG;
		}
		switch (this.fetchState) {
		case FETCH_STATE_BEFORE_TAG: return this.scanBeforeTag();
		case FETCH_STATE_IN_TAG: return this.scanTag();
		case FETCH_STATE_AFTER_TAG: return this.scanAfterTag();
		default: throw {name : "InvalidFetchStateException", message : "invalid fetchState"}; 
		}
	}
	LRCLexer.prototype.scanBeforeTag = function() {
		// Firstly consume spaces
		this.consumeSpaces();
		if (this.peak == '[') {
			this.fetchState = FETCH_STATE_IN_TAG;
			this.readch();
			return {tag:'[', val: null};
		}
		// first token of a line must be '[' otherwise skip this line
		this.skipThisLine();
	}
	LRCLexer.prototype.scanTag = function() {
		// if force fetch string
		if (this.fetchAsString) {
			let string = "";
			for (this.readch(); this.peak != ']' && this.peak != undefined && this.peak != '\n'; this.readch())
				string += this.peak;
			this.fetchAsString = false;
			return {tag:LP_TAG_STRING, val: string};
		}
		// for keywords AND strings
		if (this.peak.match(/[a-z|A-Z]/i)) {
			var str = "";
			while (this.peak.match(/[a-z|A-Z]/i)) {
				str += this.peak;
				this.readch();
			}
			this.fetchAsString = true;
			console.log("str=" +str);
			if (str == "al") return {tag: LP_TAG_AL, val: str };
			else if (str == "ar") return {tag: LP_TAG_AR, val: str };
			else if (str == "by") return {tag: LP_TAG_BY, val: str };
			else if (str == "au") return {tag: LP_TAG_AU, val: str };
			else if (str == "ti") return {tag: LP_TAG_TI, val: str };
			else if (str == "offset") return {tag: LP_TAG_OFFSET, val: str };
			this.fetchAsString = false;
			this.retract();
			
			return {tag: LP_TAG_STRING, val: str };
		}
		// for numbers
		if (this.peak.match(/[0-9]/i)) {
			let number = 0;
			while (this.peak.match(/[0-9]/i)) {
				number = number * 10 + (this.peak - '0');
				this.readch();
				//console.log(" --" + number);
			}
			//console.log(number);
			return {tag: LP_TAG_NUMBER, val: number};
		}
		if (this.peak == ']') {
			this.fetchState = FETCH_STATE_AFTER_TAG;
			this.fetchAsString = false;
			this.readch();
			if (this.peak == '[') {
				// multiple tags on a line
				this.fetchState = FETCH_STATE_BEFORE_TAG;
			}
			return {tag:']', val: null};
		}
		let P = {tag:this.peak, val: null};
		this.readch();
		return P;
	}
	LRCLexer.prototype.scanAfterTag = function() {
		// reconize as string until new-line
		let string = "";
		for (; this.peak != undefined && this.peak != '\n'; this.readch())
			string += this.peak;
		this.fetchState = FETCH_STATE_BEFORE_TAG; this.readch();
		return {tag:LP_TAG_STRING, val: string};
	}
	LRCLexer.prototype.skipThisLine = function() {
		for (this.readch(); this.peak != undefined && this.peak != '\n'; this.readch());
		this.fetchState = FETCH_STATE_BEFORE_TAG; this.readch();
	}
	
	this.readch();
}
