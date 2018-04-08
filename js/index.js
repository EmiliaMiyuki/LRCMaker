(function(){
Vue.config.devtools = !false;
Vue.config.debug = !false;
Vue.config.silent = !true;

let vm = new Vue({
    el: '#app',
    data: {
        lyricType: 1,
        musicURL: "",
        lyricText: "",
        step: 'welcome',
        musicFileName: "",
        lyricFileName: "",

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
            this.musicFileName = $("#openFile")[0].files[0].name;
            this.readFile("#openFile").then((e)=> {
                this.musicURL = e.target.result;
            });
        },
        loadLocalLyric() {
            this.lyricFileName = $("#openLyric")[0].files[0].name;   
            if (/\.lrc$/.test(this.lyricFileName))
                this.lyricType = 2;
            this.readFile("#openLyric", 'txt').then((e)=> {
                this.lyricText = e.target.result;
            });
        },

        // handlers
        _audio_change() {
            this.playPerc = document.getElementById('audio').currentTime;
        },
        startMaking() {
            if (this.musicURL=='' || this.lyricText=='') {
                alert('请选择歌词和音乐。\nPlease choose lyric and music')
                return ;
            }
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
                let lp = new LRCParser(this.lyricText);
                lp.getLyric();
                console.log(lp.lyrics);
                return lp.lyrics.map((v) => Object.assign( v, { active: false } ));
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
        },

        // Lyric
        addNewLine() {
            this.lyrics.splice(this.getSelectedLyricIndex() + 1, 0, { time: undefined, lyric: '', active: false });
        },
        removeLine() {
            this.getSelectedLyricIndex() != -1 && this.lyrics.splice(this.getSelectedLyricIndex(), 1)
        },
        moveToNext() {
            this.$refs.lyricBox.moveToNext();
        },
        moveToPrevious() {
            this.$refs.lyricBox.moveToPrevious()
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

$(document).keyup(function(e) {
    //      38
    //  37  40  39
    if (vm.step != 'making') return;

    let kc = e.keyCode;
    // 方向键上  上一句歌词
    if (kc == 38) vm.$refs.lyricBox.moveToPrevious();
    // 方向键下  下一句歌词
    else if (kc == 40) vm.$refs.lyricBox.moveToNext();
    // 方向键右  前进5秒
    else if (kc == 39) vm.seekRelative(5);
    // 方向键左  后退5秒
    else if (kc == 37) vm.seekRelative(-5);
    // 回车  插入一个timetag
    else if (kc == 13) vm.addTimeTag();  
});
})();