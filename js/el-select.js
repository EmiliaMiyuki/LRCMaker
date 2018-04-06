
Vue.component('elDropdown', {
    template: `
                 <div class="dropdown inline">
                    <a :class="['btn btn-ligh btn-sm dropdown-toggle', disabled?'disabled':'']" 
                        :style="disabled?{ color: '#999' }:{}"
                        href="javascript:void(0)" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" >
                        {{ displayText }}
                    </a>

                    <div class="dropdown-menu" aria-labelledby="dropdownMenuLink" style="max-height: 300px; overflow-y: auto; min-height: 20px;">
                        <a class="dropdown-item" href="javascript:void(0)" v-for="(v, i) in options"
                           @click="value = v; selected = i;">
                            {{ !d? v: display[i] }}
                        </a>

                    </div>
                </div>
    `,
    props: [ 'value', 'placeholder', 'options', 'default', 'display', 'defaultSelected', 'disabled' ],
    data: function() {
        return {
            d: null,
            selected: null
        }
    },
    mounted() {
        if (typeof this.defaultSelected != "undefined") {
            this.value = this.options[parseInt(this.defaultSelected)];
            this.selected = this.defaultSelected;
            //console.log(this.defaultSelected, this.value)
        }
        if (typeof this.default != "undefined")
            this.value = this.default;
        this.d = typeof this.display != "undefined";
    },
    computed: {
        displayText() {
            if (typeof this.value != "undefined" && this.value !== "") {
                return this.d == null ? this.value: this.display[this.selected || 0];
            }
            return this.placeholder;
        }
    },
    watch: {
        value(val) {
            this.$emit('input', val);
        }
    }
});
