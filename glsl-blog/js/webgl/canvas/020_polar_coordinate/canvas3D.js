/**
 * ポストエフェクト
 * ノイズを使った画面全体のゆがみ
 * 極座標も使える
 */
class polar_coordinate extends FramebufferTemplateCanvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.noise_strength = 0.2;
        this.noise_view_flag = false;
        this.polar_coordinate_flag = false;
        this.noise_type = 0;
        this.time_scale = 0.08;

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

                // ノイズ可視化
                {
                    this.parame_pane.addInput({ 'noiseView': this.noise_view_flag }, 'noiseView')
                        .on('change', (v) => {
                            this.noise_view_flag = v;
                        });
                }

                // 極座標使用
                {
                    this.parame_pane.addInput({ 'polarCoordinate': this.polar_coordinate_flag }, 'polarCoordinate')
                        .on('change', (v) => {
                            this.polar_coordinate_flag = v;
                        });
                }

                // ノイズタイプ
                {
                    this.parame_pane.addInput({ 'noiseType': this.noise_type }, 'noiseType', { step: 1, min: 0, max: 1 })
                        .on('change', (v) => {
                            this.noise_type = v;
                        });
                }

                // 時間スケール
                {
                    this.parame_pane.addInput({ 'timeScale': this.time_scale }, 'timeScale', { min: 0, max: 1 })
                        .on('change', (v) => {
                            this.time_scale = v;
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

            uniform_datas.noise_texture_unit = {
                name: 'noiseTextureUnit02',
                type: 'uniform1i',
                datas: 2,
            };

            uniform_datas.time_scale = {
                name: 'timeScale',
                type: 'uniform1f',
                datas: 0.0,
            };

            uniform_datas.noise_view_flag = {
                name: 'noiseViewFlag',
                type: 'uniform1i',
                datas: false,
            };

            uniform_datas.polar_coordinate_flag = {
                name: 'polarCoordinateFlag',
                type: 'uniform1i',
                datas: false,
            };

            uniform_datas.noise_type = {
                name: 'noiseType',
                type: 'uniform1i',
                datas: 0,
            };
        }
    }

    /**
     * ロード
     */
    load() {
        return new Promise((reslove) => {
            super.load()
            .then(() => {
                const data_container = this.webGL_data_container;

                // 使用するテクスチャをロード
                const uniform_datas = this.getPostEffectUniformDatas();
                let load_texture_promise = data_container.createTextures(
                    uniform_datas.noise_texture_unit.name,
                    uniform_datas.noise_texture_unit.datas,
                    this.data_file_path + '/snoise.png');

                Promise.all([
                    load_texture_promise
                ])
                .then((load_results) => {
                    const texture = load_results[0];
                    texture.enableBindTexture(true);

                    reslove();
                });
            });
        });
    }


    dispose() {
        this.parame_pane.dispose();
        this.parame_pane = null;

        super.dispose();
    }

    render(gl, render_data) {
        const data_container = this.webGL_data_container;

        const uniform_datas = this.getPostEffectUniformDatas();

        const noise_strength_uniform_data = uniform_datas.noise_strength;
        noise_strength_uniform_data.datas = this.noise_strength;

        const time_scale_uniform_data = uniform_datas.time_scale;
        time_scale_uniform_data.datas = this.time_scale;

        const noise_view_flag_uniform_data = uniform_datas.noise_view_flag;
        noise_view_flag_uniform_data.datas = this.noise_view_flag;

        const polar_coordinate_flag_uniform_data = uniform_datas.polar_coordinate_flag;
        polar_coordinate_flag_uniform_data.datas = this.polar_coordinate_flag;

        const noise_type_uniform_data = uniform_datas.noise_type;
        noise_type_uniform_data.datas = this.noise_type;

        const noise_texture_unit_uniform_data = uniform_datas.noise_texture_unit;
        const texture = this.webGL_data_container.getTexture(noise_texture_unit_uniform_data.name);
        texture.enableBindTexture(true);

        super.render(gl, render_data);
    }
}