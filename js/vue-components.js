Vue.component('elProgressBar', {
    template: `
    <div class="progress" @click="_click">
        <div ref="p" class="progress-bar progress-bar-striped bg-success" role="progressbar" :style="{width: value+'%'}" :aria-valuenow="value" aria-valuemin="0" aria-valuemax="100"></div>
    </div>
    `,
    props: [ 'value' ],
    methods: {
        _click(e) {
            console.log(this.$el.offsetWidth);
            let p = e.offsetX / $(this.$el).width() * 100;
            this.$emit('input', p);
        }
    }
}); 