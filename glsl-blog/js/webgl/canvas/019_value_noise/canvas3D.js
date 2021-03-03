/**
 * ポストエフェクト
 * バリューノイズをポストエフェクト
 */
class value_noise extends FramebufferTemplateCanvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.noise_strength = 1.0;

        // パラメータ調整GUI作成
        this.parame_pane = null;
        {
            const pane_element = document.querySelector('#canvas_param_pane')
            if (pane_element != null) {
                this.parame_pane = new Tweakpane({
                    container: pane_element
                });

                // ノイズ係数
                {
                    this.parame_pane.addInput({ 'noise': this.noise_strength }, 'noise', { min: 0.0, max: 1.0 })
                        .on('change', (v) => {
                            this.noise_strength = v;
                        });
                }
            }
        }

        // 固有のuniformを追加
        {
            const uniform_datas = this.getPostEffectUniformDatas();
            uniform_datas.noise_strength = {
                name: 'noiseStrength',
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

        const noise_strength_uniform_data = uniform_datas.noise_strength;
        noise_strength_uniform_data.datas = this.noise_strength;

        super.render(gl, render_data);
    }
}