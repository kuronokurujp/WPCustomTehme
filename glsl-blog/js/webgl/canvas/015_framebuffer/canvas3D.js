/**
 * フレームバッファを使ってポストエフェクトを実現
 * 画面全体を明るく、暗くする事が出来る
 */
class framebuffer extends FramebufferTemplateCanvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.brightness_value = 0.0;
        // パラメータ調整GUI作成
        this.parame_pane = null;
        {
            const pane_element = document.querySelector('#canvas_param_pane')
            if (pane_element != null) {
                this.parame_pane = new Tweakpane({
                    container: pane_element
                });

                this.parame_pane.addInput({ 'brightness': this.brightness_value }, 'brightness', { min: 0, max: 1.0 })
                    .on('change', (v) => {
                        this.brightness_value = v;
                    });
            }
        }

        // 固有のuniformを追加
        {
            const uniform_datas = this.getPostEffectUniformDatas();
            uniform_datas.brightness = {
                name: 'brigthness',
                type: 'uniform1f',
                datas: 0.0,
            };
        }
    }

    dispose() {
        if (this.parame_pane != null)
            this.parame_pane.dispose();

        this.parame_pane = null;

        super.dispose();
    }

    render(gl, render_data) {
        const uniform_datas = this.getPostEffectUniformDatas();

        const brightnes_suniform_data = uniform_datas.brightness;
        brightnes_suniform_data.datas = this.brightness_value;

        super.render(gl, render_data);
    }
}
