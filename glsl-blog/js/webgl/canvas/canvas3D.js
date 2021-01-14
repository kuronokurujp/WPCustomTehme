/**
 * 3D描画キャンバス
 * 作りが悪い
 * 3Dメッシュをオブジェクトして扱っていない
 * キャンバスの上に点を置いたり、一つのシェーダーを実行していて使い勝手が悪い
 * あくまで勉強用なので設計や効率などは無視する
 */
class Canvas3D {
    constructor(data_filepath) {
        this.data_filepath = data_filepath;
    }

    /**
     * 非同期ロード
     * 基本クラスではすぐに終了
     * 継承側でロードがあればやる
     */
    load() {
        return new Promise((resolve) => {
            resolve();
        });
    }

    /**
     * 設定
     * @param {*} shaderProgram 
     * @param {*} gl 
     * @param {*} canvas 
     */
    setup(shaderProgram, gl, canvas) {
        this.shaderProgram = shaderProgram;
        this.gl = gl;
    }

    isRenderAnimation() {
        return false;
    }

    /**
     * 描画
     */
    render() {
        // 転送情報を使用して頂点を画面にレンダリング
        // 第三引数に頂点数を渡している
        this.gl.drawArrays(this.gl.POINT, 0, this.getPointCount());
    }

    /**
     * 頂点シェーダーファイル
     */
    getVertexShaderFilePath() {
        return this.data_filepath + '/vs1.vert';
    }

    /**
     * ピクセルシェーダーファイル
     */
    getFragmentShaderFilePath() {
        return this.data_filepath + '/fs1.frag';
    }

    /**
     * 頂点シェーダーの変数
     */
    getAttributeLoactions() {
        return [
            this.gl.getAttribLocation(this.shaderProgram, 'position'),
        ];
    }

    /**
     * 頂点シェーダーの変数要素数
     */
    getAttributeStrides() {
        return [
            3,
        ];
    }

    /**
     * Uniform変数
     */
    getUniformLocations() {
        return [
            this.gl.getUniformLocation(this.shaderProgram, 'globalColor'),
        ]
    }

    /**
     * Uniform変数のタイプ
     */
    getUniformTypes() {
        return [
            'uniform4fv',
        ];
    }

    /**
     * Uniformに渡す値
     */
    getUniformLocationsValues(time) {
        return [
            [1, 1, 1, 1],
        ];
    }

    /**
     * 頂点数
     */
    getPointCount() {
        return this.getPositions().length / 3;
    }

    /**
     * 頂点シェーダーに渡す属性値リスト
     */
    getOtherVertexAttributes() {
        return null;
    }

    /**
     * 頂点シェーダーがあつかう頂点座標
     */
    getPositions() {
        return [
            // XYZの座標
            0, 0, 0,
            0, 0.5,0
        ];
    }
    
    /**
     * 頂点シェーダーが扱う頂点座標の配列
     */
    getPositionsArray() {
        return null;
    }

    /**
     * 頂点のインデックスバッファデータ取得
     * 1オブジェクトのみしか対応していない
     */
    getPointIndexs() {
        // 配列で返す
        return null;
    }

    /**
     * テクスチャのソース配列取得
     * ロードするテクスチャのファイルパス一覧
     * ここで記載しているテクスチャはロードされOpenGLのテクスチャデータとして生成される
     */
    getTextureSources() {
        return null;
    }
}