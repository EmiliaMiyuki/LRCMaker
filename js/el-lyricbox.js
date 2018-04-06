Vue.component('elLyricbox', {
    template: `
        <a :class="['list-group-item', on ? 'active cw':'']" @click="value.active = true">
            <input class="badge timestamp" :style="hasError?{}:{}" type="text" v-model="timeStr" />
            <span>{{ value.lyric }}</span>
        </a>
    `,
    props: [ 'value' ],
    data: ()=>({
        timeStr1: '',
        hasError: false,
        activeClassName: ''
    }),
    methods: {
        getTimeStr() {
            if ("undefined" == typeof this.value || "undefined" == typeof this.value.time || this.value.time < 0 || isNaN(this.value.time))
                return "";
            return `${parseInt(this.value.time / 60 / 1000)}:${String(parseInt(this.value.time / 1000 % 60)).padStart(2, '0')}.${String(this.value.time % 1000).padStart(3, '0')}`;
        },
    },
    computed: {
        time: {
            get() {
                return this.value.time;
            },
            set(val) {
                this.value.time = val;
                this.$emit('input', this.value);
            }
        },
        on() { return this.value.active; },
        timeStr: {
            get() {
                return this.getTimeStr();
            },
            set(val) {
                let R = val.match(/^(\d+):(\d{2})(.\d{1,3})?$/);
                this.hasError = R == null;
                if (this.hasError) return;
                this.time = parseInt(R[1]) * 60 * 1000 + parseInt(R[2]) * 1000
                    + (typeof R[3] == "undefined" ? 0 : parseFloat(R[3]) * 1000);
            }
        }
    },
    watch: {
        timeStr1(val) {
            let R = val.match(/^(\d+):(\d{2})(.\d{1,3})?$/);
            this.hasError = R == null;
            if (this.hasError) return;
            this.time = parseInt(R[1]) * 60 * 1000 + parseInt(R[2]) * 1000
                + (typeof R[3] == "undefined" ? 0 : parseFloat(R[3]) * 1000);
        },
        on(val) {
            let _new = this.value;
            _new.active = val;
            this.$emit('input', _new);
        }
    },
    mounted() {
        this.timeStr = this.getTimeStr();
        this.on = this.value.active;
    }
});

Vue.component('elLyricgroup', {
    template:  `
        <div class="list-group" :style="style">
            <el-lyricbox v-for="(v, i) in value" v-model="value[i]" @click.native="_unselectExcept(i)"></el-lyricbox>
        </div>
    `,
    props: [ 'value' ],
    methods: {
        getSelectedItems() {
            return this.value.filter(v=>v.active);
        },
        _unselectExcept(index) {
            for (let i=0; i<this.value.length; i++)
                if (i != index)
                    this.value[i].active = false;
        },
        moveTo(i) {
            this.value[i].active = true;
            this._unselectExcept(i);
            let height = i * 49;
            if (this.$el.offsetHeight < height)
                this.$el.scrollTop = -0.9 * this.$el.offsetHeight + height;
            else 
                this.$el.scrollTop = 0;
        },
        moveToNext() {
            if (this.selectedIndex < this.value.length - 1)
                this.moveTo(this.selectedIndex + 1);
        },
        moveToPrevious() {
            if (this.selectedIndex > 0)
                this.moveTo(this.selectedIndex - 1);
        }
    },
    computed: {
        style() {
            //console.log({ height: `${0.7 * window.innerHeight}px`, overflowY: 'auto' });
            return { height: `${0.5 * window.innerHeight}px`, overflowY: 'auto' };
        },
        selectedIndex: {
            get() {
                for (let i=0; i<this.value.length; ++i)
                    if (this.value[i].active)
                        return i;
                return -1;
            },
            set(v) {
                this.moveTo(v);
            }
        }
    }
}); 