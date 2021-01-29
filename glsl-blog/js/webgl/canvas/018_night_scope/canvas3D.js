/**
 * ポストエフェクト
 * ナイトスコープを表現
 */
class night_scope extends FramebufferTemplateCanvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.noise_strength = 1.0;
        this.saturation = 1.5;
        this.screen_color = [0.0, 1.0, 0.0];
        this.screen_color_string = '#00ff00';
        this.sin_wave = 100.0;
        this.wave_strength = 1.0;

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

                // ヴィネットの彩度
                {
                    this.parame_pane.addInput({ 'vig': this.saturation }, 'vig', { min: 1.0, max: 2.0 })
                        .on('change', (v) => {
                            this.saturation = v;
                        });
                }

                // 走査線の周期
                {
                    this.parame_pane.addInput({ 'sinWave': this.sin_wave }, 'sinWave', { min: 100.0, max: 350.0 })
                        .on('change', (v) => {
                            this.sin_wave = v;
                        });
                }

                // 走査線の強さ
                {
                    this.parame_pane.addInput({ 'waveStrength': this.wave_strength }, 'waveStrength', { min: 0.0, max: 1.0 })
                        .on('change', (v) => {
                            this.wave_strength = v;
                        });
                }

                // スクリーン色
                {
                    // 値のオブジェクト名と初期値設定の引数名と一致しないとエラーになる
                    this.parame_pane.addInput({ 'color': this.screen_color_string }, 'color')
                        .on('change', (v) => {
                            this.screen_color_string = v;

                            this.screen_color[0] = v.comps_[0] / 255.0;
                            this.screen_color[1] = v.comps_[1] / 255.0;
                            this.screen_color[2] = v.comps_[2] / 255.0;
                        });
                }
            }
        }

        // 固有のuniformを追加
        {
            const uniform_datas = this.getPostEffectUniformDatas();
            uniform_datas.screen_color = {
                name: 'screenColor',
                type: 'uniform3fv',
                datas: [],
            };

            uniform_datas.noise_strength = {
                name: 'noiseStrength',
                type: 'uniform1f',
                datas: 0.0,
            };

            uniform_datas.saturation = {
                name: 'saturation',
                type: 'uniform1f',
                datas: 0.0,
            };

            uniform_datas.sin_wave = {
                name: 'sinWave',
                type: 'uniform1f',
                datas: 0.0,
            };
            uniform_datas.wave_strength = {
                name: 'waveStrength',
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

        const screen_color_uniform_data = uniform_datas.screen_color;
        screen_color_uniform_data.datas = this.screen_color;

        const noise_strength_uniform_data = uniform_datas.noise_strength;
        noise_strength_uniform_data.datas = this.noise_strength;

        const saturation_uniform_data = uniform_datas.saturation;
        saturation_uniform_data.datas = this.saturation;

        const sin_wave_uniform_data = uniform_datas.sin_wave;
        sin_wave_uniform_data.datas = this.sin_wave;

        const wave_strength = uniform_datas.wave_strength;
        wave_strength.datas = this.wave_strength;

        super.render(gl, render_data);
    }
}