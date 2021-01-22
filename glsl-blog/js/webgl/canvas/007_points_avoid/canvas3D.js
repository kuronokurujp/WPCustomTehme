/**
 * 頂点を敷き詰めた板を表示かつマウスが近づくと頂点が離れる
 */
class ExtendsCanvas3D extends Canvas3D {
    /**
     * 設定
     * @param {*} shaderProgram 
     * @param {*} gl 
     * @param {*} canvas 
     */
    setup(shaderProgram, gl, canvas) {
        super.setup(shaderProgram, gl, canvas);

        this.mouseX = 0;
        this.mouseY = 0;

        this.canvas = canvas;

        // 頂点情報を生成
        this.positions = [];
        this.pointColors = [];
        this.pointSizes = [];
        const VERTEX_BIAS = 3;
        const VERTEX_COUNT = 10 * VERTEX_BIAS;
        const VERTEX_SIZE = 64 / VERTEX_BIAS;

        for(let x = 0; x <= VERTEX_COUNT; ++x) {
            // x方向の座標を求める
            const x_pos = 2.0 * (x / VERTEX_COUNT) - 1.0;

            for (let y = 0; y <= VERTEX_COUNT; ++y) {
                const y_pos = 2.0 * (y / VERTEX_COUNT) - 1.0;

                this.positions.push(x_pos, y_pos, 0.0);
                this.pointColors.push(x / VERTEX_COUNT, y / VERTEX_COUNT, 1, 1);
                this.pointSizes.push(VERTEX_SIZE);
            }
        }

        window.addEventListener('mousemove', (evt) => {
            // マウスの座標XY
            let x = evt.clientX;
            let y = evt.clientY;

            const width = this.canvas.width;
            const height = this.canvas.height;

            // 正規化デバイス座標系に変換
            // サイトで図付きで説明して分かりやすい
            // https://sbfl.net/blog/2016/09/05/webgl2-tutorial-3d-knowledge/#:~:text=%E6%AD%A3%E8%A6%8F%E5%8C%96%E3%83%87%E3%83%90%E3%82%A4%E3%82%B9%E5%BA%A7%E6%A8%99%EF%BC%88Normalized%20Device%20Coordinates%2C%20NDC%EF%BC%89&text=%E6%AD%A3%E8%A6%8F%E5%8C%96%E3%83%87%E3%83%90%E3%82%A4%E3%82%B9%E5%BA%A7%E6%A8%99%E3%81%AF,%E3%82%92%E6%8E%A1%E7%94%A8%E3%81%97%E3%81%A6%E3%81%84%E3%81%BE%E3%81%99%E3%80%82 

            // 一つ一つ計算を分解して座標変換する
            // わかりやすさ重視
            // ①スクリーン画面を画面半分左上にずらす
            // この計算で画面の左上が(-w/2, -h/2), 真ん中が(0, 0),右下が(w/2, h/2)を基準にした座標変換
            const sliceX = x - (width / 2);
            const sliceY = y - (height / 2);

            // ②画面半分の値で割る
            // この計算で画面の左上が(-1, -1), 真ん中が(0, 0),右下が(1, 1)を基準にした座標変換
            const divX = sliceX / (width / 2);
            const divY = sliceY / (height / 2);

            // ③x座標に*1, y座標に-1にする
            // この計算で画面の左上が(-1, 1), 真ん中が(0, 0),右下が(1, -1)を基準にした座標変換
            this.mouseX = divX * 1;
            this.mouseY = divY * -1;
        });
    }

    isRenderAnimation() {
        return true;
    }

    /**
     * 頂点シェーダーファイル
     */
    getVertexShaderFilePath() {
        return './vs1.vert';
    }

    /**
     * ピクセルシェーダーファイル
     */
    getFragmentShaderFilePath() {
        return './fs1.frag';
    }

    /**
     * 頂点シェーダーの変数
     */
    getAttributeLoactions() {
        return [
            this.gl.getAttribLocation(this.shaderProgram, 'position'),
            this.gl.getAttribLocation(this.shaderProgram, 'color'),
            this.gl.getAttribLocation(this.shaderProgram, 'pointSize'),
        ];
    }

    /**
     * 頂点シェーダーの変数要素数
     */
    getAttributeStrides() {
        return [
            3,
            4,
            1,
        ];
    }

    /**
     * 頂点シェーダーに渡す属性値リスト
     */
    getOtherVertexAttributes() {
        return [
            this.getPointColors(),
            this.getPointSizes(),
        ];
    }

    /**
     * 頂点のサイズ
     */
    getPointSizes() {
        return this.pointSizes;
    }

    /**
     * 頂点シェーダーがあつかう頂点座標
     */
    getPositions() {
        return this.positions;
    }

    /**
     * 頂点シェーダーの頂点色
     */
    getPointColors() {
        return this.pointColors;
    }

    /**
     * Uniformの変数
     */
    getUniformLocations() {
        return [
            this.gl.getUniformLocation(this.shaderProgram, 'globalColor'),
            this.gl.getUniformLocation(this.shaderProgram, 'mouse'),
            this.gl.getUniformLocation(this.shaderProgram, 'resolution'),
            this.gl.getUniformLocation(this.shaderProgram, 'time'),
        ]
    }

    /**
     * Uniformの変数のタイプ
     */
    getUniformTypes() {
        return [
            'uniform4fv',
            'uniform2fv',
            'uniform2fv',
            'uniform1fv',
        ];
    }

    /**
     * Uniformに渡す値
     */
    getUniformLocationsValues(time) {
        return [
            // 色
            [1, 1, 1, 1],
            // 正規化デバイス座標系の座標に変換したマウス座標
            [this.mouseX, this.mouseY],
            // 画面解像度
            [this.canvas.width, this.canvas.height],
            [time]
        ];
    }
}