let vm = new Vue({
    el: '#app',
    data: {
        lyricType: 1,
        musicURL: "",
        lyricText: "",
        step: 'welcome',

        lyrics: [ ],
        //playPercentage: 0,
        playPerc: 0,
        exportedLyric: "",
        durationString: 'N/A'
    },
    methods: {
        readFile(fopen, dataType = 'url') {
            return new Promise((resolve, reject) => {
                //判断是否支持FileReader
               if (window.FileReader) {
                    var reader = new FileReader();
                } else {
                   alert("换个浏览器试一下！");
                }
                //获取文件
                var file = $(fopen)[0].files[0];
                reader.onload = e => {
                    resolve(e);
                };

                if (dataType == 'url')
                    reader.readAsDataURL(file);
                else
                    reader.readAsText(file); 
            });
        },
        loadLocalMusic() {
            this.readFile("#openFile").then((e)=> {
                this.musicURL = e.target.result;
            });
        },
        loadLocalLyric() {
            this.readFile("#openLyric", 'txt').then((e)=> {
                this.lyricText = e.target.result;
            });
        },

        // handlers
        _audio_change() {
            this.playPerc = document.getElementById('audio').currentTime;
        },
        startMaking() {
            if (this.musicURL=='' || this.lyricText=='') return ;
            this.step = 'making';
            this.lyrics = this.makeLyrics();
            //this.$refs.lyricBox.moveTo(0);
            this.lyrics[0].active = true;
            $("#audio").attr("src", this.musicURL);
        },
        seekTo(percentage) {
            let audio = $("#audio")[0];
            audio.currentTime = percentage * audio.duration;
        },
        seek(seconds) {
            let audio = $("#audio")[0];
            audio.currentTime = seconds;
            playPerc = seconds;
        },
        seekRelative(seconds) {
            let audio = $("#audio")[0];
            audio.currentTime += seconds;
            playPerc = seconds;
        },

        //lyric edit
        getSelectedLyricIndex() {
            //console.log(this.$refs.lyricBox);
            for (let i=0; i<this.lyrics.length; ++i)
                if (this.lyrics[i].active)
                    return i;
            return -1;
        },

        makeLyrics() {
            if (this.lyricType == 1) {
                // Plain Text
                return this.lyricText.split('\n').map((v)=>({
                    lyric: v,
                    time: undefined,
                    active: false
                }));
            }
            else {
                // Lrc Type
                return new LRCParser(this.lyricText).getLyric().map((v) => Object.assign( v, { active: false } ));
            }
        },
        addTimeTag() {
            let index = this.getSelectedLyricIndex();
            this.lyrics[index].time = parseInt($("#audio")[0].currentTime * 1000);
            this.$refs.lyricBox.moveToNext();
        },
        exportlrc() {
            let lyric = this.lyrics.map(v=>`[${parseInt(v.time/1000/60)}:${String(parseInt(v.time/1000%60)).padStart(2, '0')}.${String(v.time % 1000).padStart(3, '0')}]${v.lyric}`).join('<br />');
            //alert(lyric);
            this.exportedLyric = lyric;
            $("#resultModal").modal();
        },
        getDurationStr() {
            let t = parseInt($("#audio")[0].duration * 1000);
            this.durationString = parseInt(t/1000/60) + ":" + String(parseInt(t/1000%60)).padStart(2, '0');
        },
        downloadLRC() {
            let lyric = this.lyrics.map(v=>`[${parseInt(v.time/1000/60)}:${String(parseInt(v.time/1000%60)).padStart(2, '0')}.${String(v.time % 1000).padStart(3, '0')}]${v.lyric}`).join('\n');
            $("#dlcontent").val(lyric);
            $('#download').submit();
        }
    },
    watch: {
        //playPercentage(v) {
        //    this.seekTo(v / 100);
        //}
    },
    computed: {
        playPercentage: {
            get(){ return this.playPerc / $("#audio")[0].duration * 100; },
            set(v) { playPerc = v; this.seekTo(v / 100); }
        },
        playtimeString() {
            let t = parseInt(this.playPerc * 1000);
            return parseInt(t/1000/60) + ":" + String(parseInt(t/1000%60)).padStart(2, '0') + "." + String(t % 1000).padStart(3, '0');
        },
        playtimeStringShort() {
            let t = parseInt(this.playPerc * 1000);
            return parseInt(t/1000/60) + ":" + String(parseInt(t/1000%60)).padStart(2, '0');
        }
    }
});