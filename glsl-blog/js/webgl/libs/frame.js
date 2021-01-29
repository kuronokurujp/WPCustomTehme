/**
 * WegGLを扱うためのフレーム群
 */

/**
 * Shaderクラス
 */
class ShaderFrame {
    constructor(gl_context) {
        this.vs = null;
        this.fs = null;
        this.shader_program = null;

        this.vertex_buffer_objects = {};
        this.uniform_objects = {};
        this.index_buffer_objects = {};

        this.gl_context = gl_context;
    }

    /**
     * 頂点とフラグメントシェーダーファイルをロード
     * @param {*} vs_file_name 
     * @param {*} fs_file_name 
     */
    load(vs_file_name, fs_file_name) {
        const gl = this.gl_context;

        // シェーダーファイルを非同期ロードする
        return new Promise((resolve) => {
            this._loadShader([
                vs_file_name,
                fs_file_name,
            ])
                .then((shaders) => {

                    // テキストシェーダーファイルを指定してコンパイルしたシェーダーを作成
                    this.vs = this._createShader(shaders[0], gl.VERTEX_SHADER);
                    this.fs = this._createShader(shaders[1], gl.FRAGMENT_SHADER);

                    // 頂点とピクセルのシェーダーを設定したプログラムを作成
                    this.shader_program = this._createProgram(this.vs, this.fs);

                    resolve(this);
                });
        });
    }

    /**
     * リソースを解放
     */
    dispose() {
        const gl = this.gl_context;

        // バッファを破棄する
        {
            // 頂点バッファを破棄
            for (let key in this.vertex_buffer_objects) {
                const vertex_buffer_object = this.vertex_buffer_objects[key];
                // 頂点バッファを破棄する前に必ずロケーションは無効にしないと破棄した時にバグる
                gl.disableVertexAttribArray(vertex_buffer_object.location);

                if (gl.isBuffer(vertex_buffer_object.buffer)) {
                    gl.deleteBuffer(vertex_buffer_object.buffer);
                }

                common_module.freeObject(vertex_buffer_object.location);
                common_module.freeObject(vertex_buffer_object.buffer);
            }
            common_module.freeObject(this.vertex_buffer_objects);
            this.vertex_buffer_objects = {};

            // インデックスバッファを破棄
            for (let key in this.index_buffer_objects) {
                const index_buffer_object = this.index_buffer_objects[key];
                if (gl.isBuffer(index_buffer_object)) {
                    gl.deleteBuffer(index_buffer_object);
                }

                common_module.freeObject(index_buffer_object);
            }
            common_module.freeObject(this.index_buffer_objects);
            this.index_buffer_objects = {};
        }

        // Uniformを破棄
        common_module.freeObject(this.uniform_objects);
        this.uniform_objects = {};

        // 各シェーダーを破棄
        if (this.vs != null) {

            if (this.shader_program != null)
                gl.detachShader(this.shader_program, this.vs);

            gl.deleteShader(this.vs);
            this.vs = null;
        }

        if (this.fs != null) {
            if (this.shader_program != null)
                gl.detachShader(this.shader_program, this.fs);

            gl.deleteShader(this.fs);
            this.fs = null;
        }

        // シェーダープログラムを破棄
        if (this.shader_program != null) {
            gl.deleteProgram(this.shader_program);
            this.shader_program = null;
        }

        this.gl_context = null;
    }

    /**
     * 頂点バッファの属性作成
     */
    createVBOAttributeData(attribute_name, stride, data) {
        const gl = this.gl_context;
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        if (attribute_name in this.vertex_buffer_objects) {
            throw new Error('vertex buffer array name duplicate => ' + attribute_name);
        }

        let location = gl.getAttribLocation(this.shader_program, attribute_name);
        let buffer = this._createVertexBufferObject(data);

        this.vertex_buffer_objects[attribute_name] = {
            location: location,
            stride: stride,
            buffer: buffer
        };
    }

    /**
     * Uniformオブジェクト生成
     */
    createUniformObject(uniform_name, type_name) {
        const gl = this.gl_context;
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        if (uniform_name in this.uniform_objects) {
            throw new Error('uniform object array name duplicate => ' + uniform_name);
        }

        let location = gl.getUniformLocation(this.shader_program, uniform_name);
        this.uniform_objects[uniform_name] = {
            location: location,
            type_name: type_name,
        };
    }

    /**
     * インデックスバッファオブジェクト作成
     */
    createIndexBufferObject(buffer_name, point_index) {
        const gl = this.gl_context;
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        if (buffer_name in this.index_buffer_objects) {
            throw new Error('index buffer array name duplicate => ' + buffer_name);
        }

        this.index_buffer_objects[buffer_name] = this._createIndexBufferObject(point_index);
    }

    /**
     * シェーダープログラムを有効化
     */
    use() {
        if (this.shader_program == null)
            return;

        const gl = this.gl_context;

        // シェーダープログラムを使用
        gl.useProgram(this.shader_program);
    }

    /**
     * VBO設定を更新
     */
    updateVertexAttribute() {
        this._setVertexAttribute(
            this.vertex_buffer_objects);
    }

    /**
     * VBOとインデックスバッファを更新
     */
    updateVertexAttributeAndIndexBuffer(
    ) {
        this._setVertexAttribute(
            this.vertex_buffer_objects,
        );

        this._setIndexBuffer(this.index_buffer_objects);
    }

    /**
     * UniformLocationのuniform変数にデータ設定
     * uniform1fvと末尾にvはベクトルなので配列データで受け取れる
     * vが付いていないならベクトルでないので1変数の受け取りを表す
     * 他にも行列を表すのもあるので注意
     * ややこしいのがuniform1fvという1要素ベクトルのタイプがある
     * この場合[value]という方法で1変数の値を受け取れる事もできる
     */
    setUniformData(uniform_name, value) {
        const gl = this.gl_context;
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        if ((uniform_name in this.uniform_objects) == false) {
            throw new Error('uniform array find not uniform name => ' + uniform_name);
        }

        const uniform_data = this.uniform_objects[uniform_name];
        const type = uniform_data.type_name;

        // uniformTypeが行列かどうかチェックして行列なら専用設定をする
        if (type.includes('Matrix') === true) {
            // 行列は配列の要素が１つのみ
            gl[type](uniform_data.location, false, value);
        }
        else {
            gl[type](uniform_data.location, value);
        }
    }

    /**
     * 指定したテキストシェーダをコンパイルしたシェーダデータを作成して返す
     * @param {*} source 
     * @param {*} type 
     */
    _createShader(source, type) {
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
    _createProgram(vs, fs) {
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
     * VBOの設定
     */
    _setVertexAttribute(
        vertex_buffer_objects) {
        const gl = this.gl_context;
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        // VBO配列からVBOを有効化して情報設定
        for (let key in vertex_buffer_objects) {
            let vertex_buffer_object = vertex_buffer_objects[key];

            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer_object.buffer);
            gl.enableVertexAttribArray(vertex_buffer_object.location);
            gl.vertexAttribPointer(
                vertex_buffer_object.location,
                vertex_buffer_object.stride,
                gl.FLOAT,
                false,
                0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }

    /**
     * インデックスバッファを設定
     * あらかじめ作成したそれぞれのインデックスバッファをバインドする
     */
    _setIndexBuffer(index_buffer_objects) {
        const gl = this.gl_context;
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        for (let key in index_buffer_objects) {
            const buffer = index_buffer_objects[key];
            // バインドしたままでないとインデックスバッファを参照しない
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        }
    }

    /**
     * 頂点のインデックスバッファオブジェクト作成
     */
    _createIndexBufferObject(datas) {
        const gl = this.gl_context;

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
     * 頂点バッファオブジェクト作成
     * @param {Array} datas 
     */
    _createVertexBufferObject(datas) {
        const gl = this.gl_context;

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
     * シェーダーファイルをロード
     * @param {*} shader_file_path_array 
     */
    _loadShader(shader_file_path_array) {
        if (Array.isArray(shader_file_path_array) !== true) {
            throw new Error('invalid argument it is not arrya');
        }

        const promises = shader_file_path_array.map((path) => {
            /**
             * ローカルサーバーを立てずにプラウザで表示できるか？
             * プラウザーのセキュリティにひっかかり出来ない
             * 特定のプラウザーであればできるが、専用対応になって汎用性がない
             */
            // fecthでリソースの非同期ロード
            // fetchメソッドはサーバーからリソースを非同期ロード
            // URLを指定してロードできる
            // なのでサーバー上で実行されていないとエラーになる
            return fetch(path, { cache: 'no-cache' })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    return response.text();
                })
        });

        return Promise.all(promises);
    }
}

/**
 * テクスチャ制御
 * テクスチャの有効切り替え、バインドができる
 */
class TextureFrame {
    constructor(gl, texture_slot) {
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        this.gl = gl;

        // スロットが使用範囲内かチェック
        const texture_max_slot = this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS;
        if (texture_max_slot < texture_slot)
            throw new Error('texture slot max(' + texture_max_slot + ') <  input slot(' + texture_slot + ')');

        this.texture_slot = texture_slot;
        this.active_texture = null;
    }

    /**
     * 外部からテクスチャを設定する場合
     */
    bindTexture(texture) {
        this.active_texture = texture;
    }

    /**
     * テクスチャファイルをロードしてテクスチャバッファを作成
     * @param {*} source 
     */
    loadFromFile(source) {
        const gl = this.gl;

        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        // テクスチャファイルを非同期ロード
        return new Promise((resolve) => {
            const img = new Image();
            // ファイル開始(失敗時は対応していない)
            // TODO: ファイルロード失敗した時の対応が必要
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
                this.active_texture = tex;
                resolve(this);
            }, false);

            // ロードするパス設定
            img.src = source;
        });
    }

    /**
     * リソースを解放
     */
    dispose() {
        const gl = this.gl;

        if (this.active_texture != null) {
            gl.activeTexture(gl.TEXTURE0 + this.texture_slot);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

            if (gl.isTexture(this.active_texture)) {
                gl.deleteTexture(this.active_texture);
            }

            this.active_texture = null;
        }

        this.gl = null;
    }

    /**
     * テクスチャのスロットをアクティブにしてロードしたテクスチャをバインド設定
     * @param {*} enable 
     */
    enableBindTexture(enable) {
        if (this.active_texture == null) {
            throw new Error('active texute is null');
        }

        const gl = this.gl;

        // 制御するテクスチャースロットを有効化
        // 0 - 最大数までテクスチャをアクティブにできる
        // モバイル端末では最大8枚までらしい
        gl.activeTexture(gl.TEXTURE0 + this.texture_slot);

        if (enable === true) {
            // ロードしたテクスチャをバインド
            // 直前のactiveTextureで有効にしたスロットにバインドされる
            gl.bindTexture(gl.TEXTURE_2D, this.active_texture);
        }
        else {
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }
}

/**
 * WebGLビュークラス
 * 描画専門のクラス
 * フルスクリーン描画前提としている
 */
class WebGLView {
    constructor() {
        this.canvas3Ds = [];
        this.canvas = null;
        this.gl_context = null;

        // 表示中の時間経過
        this.now_time = 0;
        this.begin_time = 0;

        // アニメーションレンダリングするかどうか
        this.animation_rendering = true;

        this.enable_flag = false;

        this.window_resize_flag = false;
    }

    /**
     * 初期化
     */
    init(gl_context, canvas) {
        this.gl_context = gl_context;
        this.canvas = canvas;

        const gl = this.gl_context;

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

        // 開始時間を取得
        this.begin_time = Date.now();
    }

    /**
     * 有効化
     */
    enable(animation_rendering) {
        this.begin_time = Date.now();
        this.animation_rendering = animation_rendering;

        this.enable_flag = true;
    }

    /**
     * 無効化
     */
    disable() {
        this.enable_flag = false;
    }

    /**
     * ウィンドウがリサイズされた
     */
    noticeResizeWindow() {
        this.window_resize_flag = true;
    }

    /**
     * 更新
     */
    update() {
        if (!this.enable_flag)
            return;

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
        this.now_time = (Date.now() - this.begin_time) / 1000;

        this.canvas3Ds.forEach((canvas3D) => {
            canvas3D.update(this.now_time);
        });
    }

    /**
     * 描画
     */
    render() {
        if (!this.enable_flag)
            return;

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

        // 画面を塗りつぶす色設定
        // 黒色で塗りつぶす
        gl.clearColor(0.1, 0.1, 0.1, 1.0);

        let render_data = {
            time: this.now_time,
            window_width: window.innerWidth,
            window_height: window.innerHeight,
            window_resize_flag: this.window_resize_flag
        };

        // 描画前処理
        this.canvas3Ds.forEach((canvas3D) => {
            // 描画前処理
            canvas3D.beginRender(gl, render_data);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            // 3Dのビューポートのサイズをプラウザのスクリーンサイズに合わせる
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            // カラー + 深度バッファクリア
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // 描画
            canvas3D.render(gl, render_data);

            // 描画後処理
            canvas3D.afterRender(this.now_time);
        });
        this.window_resize_flag = false;
    }

    /**
     * 描画キャンバスのアタッチ
     * @param {*} canvas3D 
     */
    attachCanvas(canvas3D) {
        // 処理が終了したら呼び出し側はThenメソッドで成功か失敗かをコールバックで受け取れる
        return new Promise((resolve, reject) => {
            canvas3D.load().then(() => {
                this.canvas3Ds.push(canvas3D);
                resolve();
            });
        });
    }

    /**
     * キャンバスを外す
     * @param {*} canvas3D 
     */
    detachCanvas(canvas3D) {
        return new Promise((resolve) => {
            if (canvas3D != null) {
                this.canvas3Ds = this.canvas3Ds.filter(c => c !== canvas3D);
            }

            resolve();
        });
    }

    /**
     * html5のCanvasサイズを画面フルサイズに更新
     */
    updateCanvasSizeToFullScreen() {
        // プラウザが開いている画面サイズを設定
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}

/**
 * 画面レンダリングのテクスチャ
 */
class RenderTexture {
    constructor(gl) {
        if (gl == null) {
            throw new Error('webgl not initialized');
        }

        this.gl = gl;
        this.texture = null;
        this.texture_slot = 0;
        this.frame_buffer = null;
        this.render_buffer = null;

        this.width = 0;
        this.height = 0;
    }

    /**
     * レンダー用のテクスチャ作成
     */
    create(texture_slot, width, height) {
        const gl = this.gl;
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
        const frame_buffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frame_buffer);

        // デプスバッファを作成
        const depth_render_buffer = gl.createRenderbuffer();
        // レンダーバッファを作成
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth_render_buffer);
        // 深度バッファ用にフォーマットを変えて深度バッファ用のレンダーバッファにする
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        // 深度バッファをフレームバッファにアタッチ
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth_render_buffer);
        // 上記のバッファがアタッチされないとポリゴンの奥行きがなくなり、奥の頂点が手前に出る事がある

        // カラーバッファを作成(色焼き付けるためのバッファ)
        // レンダーバッファにもできるが、
        // 今回はテクスチャバッファを作成
        // シェーダにテクスチャを渡すため!
        // レンダーバッファではバッファをシェーダに渡せないので
        const texture_buffer = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture_buffer);
        // テクスチャデータ作成
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        // テクスチャパラメータ設定
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // カラーバッファをフレームバッファにアタッチ
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture_buffer, 0);

        // バインドを解除
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.frame_buffer = frame_buffer;
        this.render_buffer = depth_render_buffer;

        this.width = width;
        this.height = height;
        this.texture_slot = texture_slot;

        // フレームバッファとテクスチャバッファの関連付け
        this.texture = new TextureFrame(gl, this.texture_slot);
        this.texture.bindTexture(texture_buffer);
    }

    /**
     * 破棄
     * 未使用になったら必ず呼ぶ
     * そうしないとメモリリークとなる
     */
    dispose() {
        const gl = this.gl;
        if (gl == null) {
            return;
        }

        // TODO: Resizeでうまくいかない

        // フレームバッファ情報があれば消す
        if (this.frame_buffer != null) {
            if (gl.isFramebuffer(this.frame_buffer) === true) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.deleteFramebuffer(this.frame_buffer);
            }

            this.frame_buffer = null;
        }

        // デプスバッファ情報があれば消す
        if (this.render_buffer != null) {
            if (gl.isRenderbuffer(this.render_buffer) === true) {
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                gl.deleteRenderbuffer(this.render_buffer);
            }

            this.render_buffer = null;
        }

        // テクスチャ情報があれば消す
        if (this.texture != null) {
            this.texture.dispose();
            this.texture = null;
        }
    }

    /**
     * 使用開始
     */
    begin() {
        if (this.texture == null)
            return;

        this.texture.enableBindTexture(true);
    }

    /**
     * 使用終了
     */
    end() {
        if (this.texture == null)
            return;

        this.texture.enableBindTexture(false);
    }

    /**
     * サイズ変更
     */
    resize(width, height) {
        this.dispose();
        this.create(this.texture_slot, width, height);
    }

    /**
     * レンダリング内容を書き込む
     */
    writeRendering(renderFunc) {
        const gl = this.gl;
        if (gl == null) {
            return;
        }

        if (this.frame_buffer == null) {
            throw new Error('RenderTexture: non frame buffer');
        }

        // オフスクリーンレンダリングを有効にする
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frame_buffer);
        // 3Dのビューポートのサイズをプラウザのスクリーンサイズに合わせる
        gl.viewport(0, 0, this.width, this.height);
        // カラー + 深度バッファクリア
        // 塗りつぶす色が反映
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // 描画関数
        renderFunc();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

/**
 * WebGLデータコンテナクラス
 */
class WebGLDataContainer {
    /**
     * コンストラクタ
     * jsでデストラクタはない
     */
    constructor(canvas) {
        // シェーダーフレーム一覧
        this.shader_frames = [];

        // ロードしたテクスチャ一覧
        this.textures = [];

        // レンダーテクスチャー一覧
        this.render_textures = [];

        this.canvas = null;
        this.gl_context = null;

        // canvasからGLコンテキストを取得

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
     * データ一括リリース
     */
    dispose() {
        // メモリリークしないようにする
        for (let key in this.shader_frames) {
            const shader_frame = this.shader_frames[key];

            shader_frame.dispose();
            common_module.freeObject(shader_frame);
        }
        common_module.freeObject(this.shader_frames);
        this.shader_frames = {};

        for (let key in this.textures) {
            const texture = this.textures[key];
            texture.dispose();

            common_module.freeObject(texture);
        }
        common_module.freeObject(this.textures);
        this.textures = {};

        for (let key in this.render_textures) {
            const texture = this.render_textures[key];
            texture.dispose();
            common_module.freeObject(texture);
        }
        common_module.freeObject(this.render_textures);
        this.render_textures = {};
    }

    getShaderFrame(name) {
        return this.shader_frames[name];
    }

    /**
     * シェーダフレームを生成
     * ロードする頂点とピクセルシェーダーファイルパスを指定
     */
    createShaderFrame(name, vs_file_path, fs_file_path) {
        return new Promise((resolve) => {
            if (name in this.shader_frames) {
                throw new Error('shaders array key duplicate');
            }
            this.shader_frames[name] = null;

            let shader_frame = new ShaderFrame(this.gl_context);
            shader_frame.load(
                vs_file_path,
                fs_file_path
            ).then(() => {
                // ロード成功したら管理リストに追加
                this.shader_frames[name] = shader_frame;
                resolve(this.shader_frames[name]);
            });
        });
    }

    getTexture(name) {
        if (!(name in this.textures)) {
            throw new Error('texture list find not name => ' + name);
        }
        return this.textures[name];
    }

    /**
     * シェーダーで利用するテクスチャをファイルパス指定でロード
     */
    createTextures(name, texture_slot, texture_file_path) {
        return new Promise((resolve) => {
            if (name in this.textures) {
                throw new Error('textures array key duplicate');
            }
            // 1フレーム内で連続実行しても要素の多重チェックを出来るようにするため先に要素のみ作成しておく
            this.textures[name] = null;

            let texture_frame = new TextureFrame(this.gl_context, texture_slot);
            texture_frame.loadFromFile(texture_file_path)
                .then((tex) => {
                    this.textures[name] = tex;
                    resolve(this.textures[name]);
                });
        });
    }

    /**
     * レンダーテクスチャーを生成
     * 書き込む先のテクスチャスロットを指定する
     */
    createRenderTexture(name, texture_slot, width, height) {
        if (name in this.render_textures) {
            throw new Error('render_texture array name duplicate => ' + name);
        }

        const render_texture = new RenderTexture(this.gl_context);
        render_texture.create(texture_slot, width, height);

        this.render_textures[name] = render_texture;
    }

    /**
     * 生成したレンダーテクスチャーを取得
     */
    getRenderTexture(name) {
        if ((name in this.render_textures) == false) {
            throw new Error('render_texture array name find not => ' + name);
        }

        return this.render_textures[name];
    }
}