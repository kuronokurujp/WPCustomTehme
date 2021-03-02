/**
 * ポストエフェクト
 * 画面の光の強さを表示するグレースケール
 * 画面の一部を切り取って表示するヴィネット
 */
class gray_scale_and_vignette extends FramebufferTemplateCanvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.gray_saturation = 0.5;
        this.vignette_value = 0.75;

        // パラメータ調整GUI作成
        this.parame_pane = null;
        {
            const pane_element = document.querySelector('#canvas_param_pane')
            if (pane_element != null) {
                this.parame_pane = new Tweakpane({
                    container: pane_element
                });

                this.parame_pane.addInput({ 'gray': this.gray_saturation }, 'gray', { min: 0, max: 1.0 })
                    .on('change', (v) => {
                        this.gray_saturation = v;
                    });

                this.parame_pane.addInput({ 'vignette': this.vignette_value }, 'vignette', { min: 0, max: 2.0 })
                    .on('change', (v) => {
                        this.vignette_value = v;
                    });

            }
        }

        // 固有のuniformを追加
        {
            const uniform_datas = this.getPostEffectUniformDatas();
            uniform_datas.gray_saturation = {
                name: 'graySaturation',
                type: 'uniform1f',
                datas: 0.0,
            };

            uniform_datas.vignette = {
                name: 'vignetteValue',
                type: 'uniform1f',
                datas: 0.0,
            };
        }


    }

    dispose() {
        this.parame_pane.dispose();
        this.parame_pane = null;

        super.dispose();
    }

    render(gl, render_data) {
        const uniform_datas = this.getPostEffectUniformDatas();

        const gray_saturation_uniform_data = uniform_datas.gray_saturation;
        gray_saturation_uniform_data.datas = this.gray_saturation;

        const vignette_uniform_data = uniform_datas.vignette;
        vignette_uniform_data.datas = this.vignette_value;

        super.render(gl, render_data);
    }
}