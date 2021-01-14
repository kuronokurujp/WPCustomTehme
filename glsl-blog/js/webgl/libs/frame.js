/**
 * WegGLを扱うためのフレーム群
 */

/**
 * Shaderクラス
 */
class ShaderFrame {
    constructor() {
        this.vs = null;
        this.fs = null;
        this.shaderProgram = null;
        this.vertexBufferObjects = [];
        this.indexBufferObject = [];
        this.webGLFrame = null;

        this.attributeLoacions = [];
        this.attributeStrides = [];

        this.uniformLocations = [];
        this.uniformTypes = [];
    }

    /**
     * 頂点とフラグメントシェーダーファイルをロード
     * @param {*} webglFrame 
     * @param {*} vsFileName 
     * @param {*} fsFileName 
     */
    load(webglFrame, vsFileName, fsFileName) {
        const webgl = webglFrame;
        const gl = webgl.gl_context;

        this.webGLFrame = webglFrame;

        // シェーダーファイルを非同期ロードする
        return new Promise((resolve) => {
            webgl.loadShader([
                vsFileName,
                fsFileName,
            ])
            .then((shaders) => {

                // テキストシェーダーファイルを指定してコンパイルしたシェーダーを作成
                this.vs = webgl.createShader(shaders[0], gl.VERTEX_SHADER);
                this.fs = webgl.createShader(shaders[1], gl.FRAGMENT_SHADER);

                // 頂点とピクセルのシェーダーを設定したプログラムを作成
                this.shaderProgram = webgl.createProgram(this.vs, this.fs);

                resolve(this);
            });
        });
    }

    setAttributeLocations(v) {
        this.attributeLoacions = v;
    }

    createAttributeLocation(attrName, stride, data) {
        const webGLFrame = this.webGLFrame;
        const gl = webGLFrame.gl_context;

        let location = gl.getAttribLocation(this.shaderProgram, attrName);

        this.attributeLoacions.push(location);
        this.attributeStrides.push(stride);
        this.addVertexBufferObject(webGLFrame.createVertexBufferObject(data));
    }

    createUniformLocation(uniformName, typeName) {
        const gl = this.webGLFrame.gl_context;

        let location = gl.getUniformLocation(this.shaderProgram, uniformName);
        this.uniformLocations.push(location);
        this.uniformTypes.push(typeName);
    }

    createIndexBufferObject(pointIndex) {
        const webGLFrame = this.webGLFrame;
        this.addIndexBufferObject(webGLFrame.createIndexBufferObject(pointIndex));
    }

    setAttributeStrides(v) {
        this.attributeStrides = v;
    }

    setUniformLocations(v) {
        this.uniformLocations = v;
    }

    setUniformTypes(v) {
        this.uniformTypes = v;
    }

    addVertexBufferObject(v) {
        this.vertexBufferObjects.push(v);
    }

    addIndexBufferObject(v) {
        this.indexBufferObject.push(v);
    }

    use() {
        const gl = this.webGLFrame.gl_context;

        // シェーダープログラムを使用
        gl.useProgram(this.shaderProgram);
    }

    /**
     * VBOの設定
     * @param {*} vertexBufferObjects 
     * @param {*} attributeLoacions 
     * @param {*} attributeStrides 
     * @param {*} indexBufferObject 
     */
    setVertexAttribute(
        vertexBufferObjects, 
        attributeLoacions, 
        attributeStrides,
        indexBufferObject) {

        this.webGLFrame.setVertexAttribute(
            vertexBufferObjects, 
            attributeLoacions, 
            attributeStrides, 
            indexBufferObject);
    }

    /**
     * インデックスバッファのみ指定して
     * 残りはクラス内で持っているVBOとATTRを渡す
     * @param {*} indexBufferObject 
     */
    setVertexAttribute(
        indexBufferObject
    ) {
        this.webGLFrame.setVertexAttribute(
            this.vertexBufferObjects, 
            this.attributeLoacions, 
            this.attributeStrides, 
            indexBufferObject);
    }

    /**
     * UniformLocationをuniform変数に設定
     * @param {*} values 
     */
    setUniform(values) {
        this.webGLFrame.setUniform(
            values,
            this.uniformLocations,
            this.uniformTypes
        );
    }
}

/**
 * テクスチャ制御
 * テクスチャの有効切り替え、バインドができる
 */
class TextureFrame {
    constructor(gl, textureSlot, activeTexture) {
        this.gl = gl;
        this.textureSlot = textureSlot;
        this.activeTexture = activeTexture;
    }

    /**
     * テクスチャスロットを有効
     * @param {*} enable 
     */
    enableSlot() {
        const gl = this.gl;

        // ロードしたテクスチャをバインド
        // 0 - 最大数までテクスチャをアクティブにできる
        // モバイル端末では最大あ8枚までらしい
        gl.activeTexture(gl.TEXTURE0 + this.textureSlot);
    }

    /**
     * テクスチャをバインドするか設定
     * @param {*} enable 
     */
    enableBind(enable) {
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, null);
        if (enable === true) {
            // MEMO:
            // テクスチャをバインドした時にテクスチャユニット何番にバインドされる？
            gl.bindTexture(gl.TEXTURE_2D, this.activeTexture);
        }
    }
}

/**
 * WebGL制御クラス
 */
class WebGLFrame {
    /**
     * コンストラクタ
     * jsでデストラクタはない
     */
    constructor() {
        // メンバー変数を定義
        // ここで定義すると宣言したと見なされる
        // 描画Canvas
        this.canvas = null;

        // WebGLのインスタンス
        this.gl_context = null;

        // アニメーションレンダリングするかどうか
        this.animation_rendering = false;

        // 表示中の時間経過
        this.nowTime = 0;
        this.beginTime = 0;

        // シェーダーフレーム一覧
        this.shaderFrames = [];

        // ロードしたテクスチャ一覧
        this.textures = [];
    }

    init(canvas) {
        // 引数の型をチェック

        // canvasがHTMLCanvasElementならそのまま代入
        // HTMLCanvasElementはcanvas要素のインターフェイス
        if (canvas instanceof HTMLCanvasElement == true) {
            this.canvas = canvas;
        }
        /**
         * 文字列型かどうかの型判定
         * 文字列もオブジェクトである。
         * オブジェクト名を取り出して名前から型を判別できる
         * この記事が一番参考になった
         * https://qiita.com/south37/items/c8d20a069fcbfe4fce85 
         */
        else if (Object.prototype.toString.call(canvas) == '[object String]') {
            // #をつけた文字列でcanvas要素を取得
            const c = document.querySelector(`#${canvas}`);
            if (c instanceof HTMLCanvasElement == true) {
                this.canvas = c
            }
        }

        // canvasがない場合は例外エラー
        if (this.canvas == null) {
            throw new Error('invalid argument');
        }

        // canvasからWebGLコンテキスト取得
        // canvas内にWebGLコンテキストがあるのか
        this.gl_context = this.canvas.getContext('webgl');
        if (this.gl_context == null) {
            // WebGLのコンテキストが取得出来ないならエラー
            throw new Error('webgl not supported');
        }
    }

    /**
     * Canvas3Dを指定してロード
     * @param {*} canvas3D 
     */
    load(canvas3D) {
        const gl = this.gl_context;

        // 非同期処理をする

        // 処理が終了したら呼び出し側はThenメソッドで成功か失敗かをコールバックで受け取れる
        return new Promise((resolve, reject) => {
            canvas3D.load().then(() => {
                // シェーダーファイルを非同期ロードする
                if (typeof canvas3D.shaderVersion == 'undefined') {
                    let shaderFrame = new ShaderFrame();
                    this.shaderFrames.push(shaderFrame);

                    shaderFrame.load(
                        this,
                        canvas3D.getVertexShaderFilePath(),
                        canvas3D.getFragmentShaderFilePath(),
                    )
                    .then(() => {
                        canvas3D.setup(shaderFrame.shaderProgram, gl, this.canvas);

                        // シェーダーに情報を設定が出来る参照情報を取得
                        {
                            // 頂点シェーダーに設定できる変数の参照情報を作成
                            shaderFrame.setAttributeLocations(canvas3D.getAttributeLoactions());

                            // 頂点シェーダーの変数に対応するストライドを配列に入れる
                            shaderFrame.setAttributeStrides(canvas3D.getAttributeStrides());

                            // ピクセルシェーダーに設定できる変数の参照情報を作成
                            shaderFrame.setUniformLocations(canvas3D.getUniformLocations());

                            // uniform変数に対応するタイプを配列に設定
                            shaderFrame.setUniformTypes(canvas3D.getUniformTypes());
                        }

                        // 頂点座標から頂点バッファを生成
                        {
                            this.positions = canvas3D.getPositions();

                            // 頂点情報を書き込むバッファ配列を作成
                            // 座標は必ず必要
                            this.vertexBufferObjects = [];
                            if (this.positions != null) {
                                shaderFrame.addVertexBufferObject(this.createVertexBufferObject(this.positions));
                            }

                            // 他に座標データがあればVBOを作成して追加
                            let positionsArray = canvas3D.getPositionsArray();
                            if (positionsArray != null) {
                                positionsArray.forEach(poss => {
                                    shaderFrame.addVertexBufferObject(this.createVertexBufferObject(poss));
                                });
                            }

                            // それ以外の頂点属性があれば追加
                            const vertexAttribute = canvas3D.getOtherVertexAttributes();
                            if (vertexAttribute != null) {
                                vertexAttribute.forEach((attribute, index) => {
                                    shaderFrame.addVertexBufferObject(this.createVertexBufferObject(attribute));
                                });
                            }
                        }

                        // インデックスバッファのデータがあれば生成
                        this.indexBufferObject = null;
                        {
                            this.pointIndex = canvas3D.getPointIndexs();
                            if (this.pointIndex != null) {
                                shaderFrame.addIndexBufferObject(this.createIndexBufferObject(this.pointIndex));
                            }
                        }

                        this.canvas3D = canvas3D;

                        // テクスチャ作成があれば実行
                        let textureSources = this.canvas3D.getTextureSources();
                        if (textureSources != null) {

                            this.loadAllTexture(textureSources)
                            .then((textures) => {
                                // テクスチャ生成ではbind / unbindをしているので生成直後にbindすると
                                // 2つ目のテクスチャ生成した時にactiveしたbindがunbindされるから
                                // 一気にバインドする
                                textures.forEach((activeTexture, textureIndex) => {
                                    let textureFrame = new TextureFrame(gl, textureIndex, activeTexture);

                                    // テクスチャを有効にしておく
                                    textureFrame.enableSlot();
                                    textureFrame.enableBind(true);

                                    this.textures.push(textureFrame);
                                });

                                resolve();
                            });
                        }
                        else {
                            // シェーダーをロードして扱えるようになったのでロード完了
                            resolve();
                        }
                    });
                }
                // 複数シェーダーロード
                else {
                    let compCount = 0;
                    let shaderFilePathArray = canvas3D.getShaderFilePathArray();
                   shaderFilePathArray.forEach(shaderPair => {
                        let shaderFrame = new ShaderFrame();
                        this.shaderFrames.push(shaderFrame);
                        shaderFrame.load(
                            this,
                            // 0がvsファイル / 1がfsファイル
                            shaderPair[0],
                            shaderPair[1],
                        )
                        .then(() => {
                            ++compCount;
                            if (shaderFilePathArray.length <= compCount) {
                                // 全てロードが終了した場合非同期を終了させる
                                // キャンバス側で各シェーダーのセットアップが必要
                                canvas3D.setup(this, this.shaderFrames);

                                this.canvas3D = canvas3D;

                                // テクスチャ作成があれば実行
                                let textureSources = this.canvas3D.getTextureSources();
                                if (textureSources != null) {

                                    this.loadAllTexture(textureSources)
                                    .then((textures) => {
                                        // テクスチャ生成ではbind / unbindをしているので生成直後にbindすると
                                        // 2つ目のテクスチャ生成した時にactiveしたbindがunbindされるから
                                        // 一気にバインドする
                                        textures.forEach((activeTexture, textureIndex) => {
                                            let textureFrame = new TextureFrame(gl, textureIndex, activeTexture);
                                            // テクスチャスロットの有効やバインドはCanvas内で行う

                                            this.textures.push(textureFrame);
                                        });

                                        resolve();
                                    });
                                }
                                else {
                                    // シェーダーをロードして扱えるようになったのでロード完了
                                    resolve();
                                }
                            }
                        });
                    });
                }
            });
        });
    }

    /**
     * 描画のセットアップ
     */
    setup() {
        const gl = this.gl_context;

        // 画面を塗りつぶす色設定
        // 黒色で塗りつぶす
        gl.clearColor(0.1, 0.1, 0.1, 1.0);

        /**
         * 深度バッファを有効化する事で奥行判定を可能にする
         * 深度バッファの深度値を比較して頂点が手前なのか奥を判定
         * 判定して奥なら描画しない
         * これらの仕組みを「深度テスト」
         */
        // 深度値を設定
        gl.clearDepth(1.0);
        // 深度テストを有効にする
        gl.enable(gl.DEPTH_TEST);

        // 今回は1度のみの描画更新でいい
        this.animation_rendering = this.canvas3D.isRenderAnimation();

        // 開始時間を取得
        this.beginTime = Date.now();
    }
    
    /**
     * 更新
     */
    update() {
        if (this.animation_rendering == true) {
            /**
            * 1フレーム毎に実行する
            * this.xxx.bind(this)としないとthisの情報が渡されないのでundefineになるので注意
            * 一番参考になったサイト
            * https://qiita.com/haguhoms/items/4c6f93f2aefda055ce1b 
            */
            requestAnimationFrame(this.update.bind(this));
        }

        // 表示からの経過時間を取得
        this.nowTime = (Date.now() - this.beginTime) / 1000;

        if (typeof this.canvas3D.update != 'undefined') {
            this.canvas3D.update(this.nowTime);
        }
    }

    /**
     * 描画
     */
    render() {
        const gl = this.gl_context;

        if (this.animation_rendering == true) {
            /**
            * 1フレーム毎に実行する
            * this.xxx.bind(this)としないとthisの情報が渡されないのでundefineになるので注意
            * 一番参考になったサイト
            * https://qiita.com/haguhoms/items/4c6f93f2aefda055ce1b 
            */
            requestAnimationFrame(this.render.bind(this));
        }

        // canvasのサイズを画面いっぱいにする
        this.updateCanvasSizeToFullScreen();

        // 専用処理
        // バージョンによって描画ロジックを切り替え
        // 古いのと新しいので切り分けが簡単になっていない設計になっているのが問題
        if (typeof this.canvas3D.shaderVersion == 'undefined') {
            // 3Dのビューポートのサイズをプラウザのスクリーンサイズに合わせる
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);

            // カラー + 深度バッファクリア
            // 塗りつぶす色が反映
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // VBOとattribute locationを使用して頂点を有効
            const shaderFrame = this.shaderFrames[0];

            // シェーダープログラムを使用
            gl.useProgram(shaderFrame.shaderProgram);

            this.setVertexAttribute(
                shaderFrame.vertexBufferObjects, 
                shaderFrame.attributeLoacions, 
                shaderFrame.attributeStrides, 
                shaderFrame.indexBufferObject[0]);

            // キャンバスのレンダリング
            // キャンバスのバージョンをみて使い方を変える
            // やり方がまずいとは思う
            if (typeof this.canvas3D.version == 'undefined') {
                this.canvas3D.render();
                this.updateUniform();
            }
            else {
                switch (this.canvas3D.version) {
                    case 1: {
                        this.canvas3D.render(this);
                        break;
                    }
                    case 2: {
                        this.canvas3D.render(this, this.nowTime);
                        break;
                    }
                }
            }
        }
        else {
            // renderメソッド内で画面クリアとviewport設定をする
            this.canvas3D.render(this.nowTime);
        }
    }

    /**
     * uniform設定
     */
    updateUniform() {
        const shaderFrame = this.shaderFrames[0];
        // uniform locationのデータをuniform変数にデータ転送
        this.setUniform(
        this.canvas3D.getUniformLocationsValues(this.nowTime),
        shaderFrame.uniformLocations,
        shaderFrame.uniformTypes);
    }

    /**
     * Canvasサイズを画面フルサイズに更新
     */
    updateCanvasSizeToFullScreen() {
        // プラウザが開いている画面サイズを設定
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * シェーダーファイルをロード
     * @param {*} shaderFilePathArray 
     */
    loadShader(shaderFilePathArray) {
        if (Array.isArray(shaderFilePathArray) !== true) {
            throw new Error('invalid argument it is not arrya');
        }

        const promises = shaderFilePathArray.map((path) => {
            /**
             * ローカルサーバーを立てずにプラウザで表示できるか？
             * プラウザーのセキュリティにひっかかり出来ない
             * 特定のプラウザーであればできるが、専用対応になって汎用性がない
             */
            // fecthでリソースの非同期ロード
            // fetchメソッドはサーバーからリソースを非同期ロード
            // URLを指定してロードできる
            // なのでサーバー上で実行されていないとエラーになる
            return fetch(path).then((response) => { return response.text(); })
        });

        return Promise.all(promises);
    }

    /**
     * 指定したテキストシェーダをコンパイルしたシェーダデータを作成して返す
     * @param {*} source 
     * @param {*} type 
     */
    createShader(source, type) {
        if (this.gl_context == null) {
            throw new Error('webgl not initialized');
        }

        const gl = this.gl_context;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        }

        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    /**
     * 頂点とピクセルの２つシェーダからシェーダプログラムを生成
     * @param {*} vs 
     * @param {*} fs 
     */
    createProgram(vs, fs) {
        const gl = this.gl_context;
        if (gl == null) {
            throw new Error('webgl not initialiazed');
        }

        // シェーダプログラムを作る
        const program = gl.createProgram();
        // シェーダープログラムに頂点とピクセルのシェーダをアタッチ
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        // OpenGLにシェーダープログラムをリンクさせる
        gl.linkProgram(program);

        // シェーダープログラムがOpgnGLとリンクになっているかチェック
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            // リンク状態であればシェーダープログラムを使用状態にする
            gl.useProgram(program);
            return program;
        }

        alert(gl.getProgramInfoLog(program));
        return null;
    }

    /**
     * 頂点バッファオブジェクト作成
     * @param {Array} datas 
     */
    createVertexBufferObject(datas) {
        const gl = this.gl_context;
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        // 配列バッファを生成
        const vbo = gl.createBuffer();
        // 作成したバッファをバインド
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        // float型の配列をバッファに書き込む
        // バッファの用途を指定している。
        // 今回は頂点バッファの変更がないので「gl.STATIC_DRAW」
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(datas), gl.STATIC_DRAW);
        // バインドを解除
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return vbo;
    }

    /**
     * 頂点のインデックスバッファ作成
     * @param {*} datas 
     */
    createIndexBufferObject(datas) {
        const gl = this.gl_context;
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        // 配列バッファを生成
        const ibo = gl.createBuffer();
        // 作成したバッファをバインド
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        // float型の配列をバッファに書き込む
        // バッファの用途を指定している。
        // 今回は頂点バッファの変更がないので「gl.STATIC_DRAW」
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(datas), gl.STATIC_DRAW);
        // バインドを解除
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return ibo;
    }

    /**
     * VBOの設定
     * @param {*} vertexBufferObjects 
     * @param {*} attributeLoacions 
     * @param {*} attributeStrides 
     * @param {*} indexBufferObject 
     */
    setVertexAttribute(
        vertexBufferObjects, 
        attributeLoacions, 
        attributeStrides,
        indexBufferObject) {
        const gl = this.gl_context;
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        // VBO配列からVBOを有効化して情報設定
        vertexBufferObjects.forEach((vertexBufferObject, index) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
            gl.enableVertexAttribArray(attributeLoacions[index]);
            gl.vertexAttribPointer(
                attributeLoacions[index], 
                attributeStrides[index],
                gl.FLOAT,
                false,
                0, 0);
        });

        // indexバッファがあれば設定
        if (indexBufferObject != null) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
        }
    }

    /**
     * UniformLocationをuniform変数に設定
     * uniform1fvと末尾にvはベクトルなので配列データで受け取れる
     * vが付いていないならベクトルでないので1変数の受け取りを表す
     * 他にも行列を表すのもあるので注意
     * ややこしいのがuniform1fvという1要素ベクトルのタイプがある
     * この場合[value]という方法で1変数の値を受け取れる事もできる
     * @param {*} values 
     * @param {*} uniformLocations 
     * @param {*} uniformTypes 
     */
    setUniform(values, uniformLocations, uniformTypes) {
        const gl = this.gl_context;
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        values.forEach((value, index) => {
            const type = uniformTypes[index];
            // uniformTypeが行列かどうかチェックして行列なら専用設定をする
            if (type.includes('Matrix') === true) {
                // 行列は配列の要素が１つのみ
                gl[type](uniformLocations[index], false, value[0]);
            }
            else {
                gl[type](uniformLocations[index], value);
            }
        });
    }

    /**
     * テクスチャファイルをロードしてテクスチャバッファを作成
     * @param {*} source 
     */
    createTextureFromFile(source) {
        if (this.gl_context == null) {
            throw new Error('webgl not initialized');
        }

        // テクスチャファイルを非同期ロード
        return new Promise((resolve) => {
            const gl = this.gl_context;
            const img = new Image();
            // ファイル開始(失敗時は対応していない)
            img.addEventListener('load', () => {

                // ファイルロード成功

                // OpenGLで扱うテクスチャデータ作成
                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);

                // テクスチャを作成
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

                // 作成したテクスチャにパラメータ設定
                gl.generateMipmap(gl.TEXTURE_2D);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.bindTexture(gl.TEXTURE_2D, null);

                // 非同期終了
                resolve(tex);
            }, false);

            // ロードするパス設定
            img.src = source;
        });
    }

    /**
     * フレームバッファ作成
     * フレーム、デプス、テクスチャの３つのバッファを返す
     * @param {*} width 
     * @param {*} height 
     */
    createFrameBuffer(width, height) {
        const gl = this.gl_context;
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        /**
         * フレームバッファを作成するには
         * フレームバッファ
         * フレームバッファにアタッチさせるデプスバッファ
         * フレームバッファにアタッチさせるテクスチャ
         * これらが必要
         */

        // フレームバッファを作成
        const frameBuffer = gl.createFramebuffer() ;
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

        // デプスバッファを作成
        const depthRenderBuffer = gl.createRenderbuffer();
        // レンダーバッファを作成
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
        // 深度バッファ用にフォーマットを変えて深度バッファ用のレンダーバッファにする
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        // 深度バッファをフレームバッファにアタッチ
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
        // 上記のバッファがアタッチされないとポリゴンの奥行きがなくなり、奥の頂点が手前に出る事がある

        // カラーバッファを作成(色焼き付けるためのバッファ)
        // レンダーバッファにもできるが、
        // 今回はテクスチャバッファを作成
        // シェーダにテクスチャを渡すため!
        // レンダーバッファではバッファをシェーダに渡せないので
        const textureBuffer = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, textureBuffer);
        // テクスチャデータ作成
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        // テクスチャパラメータ設定
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // カラーバッファをフレームバッファにアタッチ
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureBuffer, 0);

        // バインドを解除
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // 変数をまとめてグループとして返す事が出来る
        // 構造体になる
        return {
            framebuffer: frameBuffer, 
            renderbuffer: depthRenderBuffer,
            texturebuffer: textureBuffer
        };
    }

    /**
     * フレームバッファを消す
     * @param {*} frameBufferObject 
     */
    deleteFrameBuffer(frameBufferObject) {
        const gl = this.gl;
        if (gl == null) {
            return;
        }
        if (frameBufferObject == null) {
            return;
        }

        // フレームバッファ情報があれば消す
        if (frameBufferObject.hasOwnProperty('framebuffer') === true
        &&  gl.isFramebuffer(frameBufferObject.framebuffer) === true) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.deleteFrameBuffer(frameBufferObject.framebuffer);
            frameBufferObject.framebuffer = null;
        }

        // デプスバッファ情報があれば消す
        if (frameBufferObject.hasOwnProperty('renderbuffer') === true
        &&  gl.isRenderbuffer(frameBufferObject.renderbuffer) === true) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.deleteRenderbuffer(frameBufferObject.renderbuffer);
            frameBufferObject.renderbuffer = null;
        }

        // テクスチャ情報があれば消す
        if (frameBufferObject.hasOwnProperty('texturebuffer') === true
        &&  gl.isTexture(frameBufferObject.texturebuffer) === true) {
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.deleteTexture(frameBufferObject.texturebuffer);
            frameBufferObject.texturebuffer = null;
        }
        frameBufferObject = null;
    }

    /**
     * テクスチャを全てロード
     * @param {*} sources 
     */
    loadAllTexture(sources) {
        return new Promise((resolve) => {
            this._loadAllTexture(sources, 0, [], (textures) => {
                resolve(textures);
            });
        });
    }

    /**
     * テクスチャを全てロード(private)
     * テクスチャパスのリストを再帰実行してロード
     * リストの上から下の順番でロード結果を出すためにこうした
     * @param {*} sources 
     * @param {*} index 
     * @param {*} output_textures 
     * @param {*} resolve 
     */
    _loadAllTexture(sources, index, output_textures, resolve) {
        this.createTextureFromFile(sources[index])
        .then((tex) => {
            output_textures.push(tex);
            ++index;

            if (sources.length <= index) {
                resolve(output_textures);
            }
            else {
                let new_textures = [];
                new_textures = output_textures.slice();
                this._loadAllTexture(sources, index, new_textures, resolve);
            }
        });
    }
}