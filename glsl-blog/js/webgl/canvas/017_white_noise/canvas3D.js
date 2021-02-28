/**
 * ポストエフェクト
 * ホワイトノイズ
 * 画面のピクセルRGBに乱数値を掛け算する事で白黒灰色のピクセルRGBにする
 * 乱数なので掛け算する値がバラバラになる事からピクセルRGB値もバラバラになりノイズのような表現となる
 */
class white_noise extends FramebufferTemplateCanvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.random_type = false;
        this.noise_strength = 0.5;

        // パラメータ調整GUI作成
        this.parame_pane = null;
        {
            const pane_element = document.querySelector('#canvas_param_pane')
            if (pane_element != null) {
                this.parame_pane = new Tweakpane({
                    container: pane_element
                });

                // ノイズランダムタイプ切り替え
                {
                    // 値のオブジェクト名と初期値設定の引数名と一致しないとエラーになる
                    this.parame_pane.addInput({ 'noise_type_02': this.random_type }, 'noise_type_02')
                        .on('change', (v) => {
                            this.random_type = v;
                        });
                }

                // ノイズ係数
                {
                    // 値のオブジェクト名と初期値設定の引数名と一致しないとエラーになる
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
            uniform_datas.random_type = {
                name: 'randomType',
                type: 'uniform1i',
                datas: false,
            };

            uniform_datas.noise_strength = {
                name: 'noiseStrength',
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

        const random_type_uniform_data = uniform_datas.random_type;
        random_type_uniform_data.datas = this.random_type;

        const noise_strength_uniform_data = uniform_datas.noise_strength;
        noise_strength_uniform_data.datas = this.noise_strength;

        super.render(gl, render_data);
    }

}