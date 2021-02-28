<?php

/**
 * 日記のサムネイル情報を登録するためのカスタムフィールド
 */
require_once get_template_directory() . '/inc/custom_field/dairy_thumbnail_item.php';

/**
 * 日記のサムネイル用のカスタムフィールドクラス
 */
class CustomFieldDairyThumbnail
{
    // サムネイル最大数
    const FIELD_ITEM_MAX = 10;

    /**
     * キャンバス名一覧を配列で取得
     */
    public static function get_canvas_name_list()
    {
        $canvas_names = [];
        // WebGLディレクトリのサブディレクトリ名一覧を設定
        // jsファイルをおいているPCのディレクトリ名を取得するのでuriでは取得できない
        $js_dirpath = get_template_directory() . '/js/webgl/canvas';
        if (is_dir($js_dirpath)) {
            $dir_names = scandir($js_dirpath);
            foreach ($dir_names as $dir_name) {
                if (strpos($dir_name, '.') === 0)
                    continue;

                // ディレクトリ名にパスをくっつける
                $dir_path = $js_dirpath . '/' . $dir_name;
                if (!is_dir($dir_path))
                    continue;

                array_push($canvas_names, $dir_name);
            }
        } else {
            error_log('none dir => ' . $js_dirpath);
        }

        return $canvas_names;
    }

    // 連想配列名を定数化
    private $data_structure = array(
        'thumbnail_id' => [], // サムネイルのアイキャッチ画像postIDのリスト
        'webgl_canvas_name' => [], // WebGLのキャンバス名のリスト
    );

    private $field_datas = array();

    public function __construct()
    {
        // アイキャッチ画像リストを取得
        {
            array_push($this->data_structure['thumbnail_id'], null);

            // メディアライブラリの一覧を取得 
            $args = array(
                'post_type'      => 'attachment',
                'numberposts'    => -1,
                'post_status'    => null,
                'post_mime_type' => 'image'
            );

            $attachments = get_posts($args);
            if ($attachments) {
                foreach ($attachments as $attachment) {
                    array_push($this->data_structure['thumbnail_id'], $attachment);
                }
            }
        }

        // WebGL描画タイプリストを取得
        {
            foreach (CustomFieldDairyThumbnail::get_canvas_name_list() as $canvas_name) {
                array_push($this->data_structure['webgl_canvas_name'], $canvas_name);
            }
        }

        // カスタムフィールドの項目インスタンスを作成
        {
            for ($i = 0; $i < CustomFieldDairyThumbnail::FIELD_ITEM_MAX; ++$i)
                array_push($this->field_datas, new DairyThumbnailItem($i + 1));
        }

        // 管理画面でカスタムフィールドが使えるようにアクションをフックする
        add_action('admin_menu', array($this, 'add_dairy_thumbnail'));
        add_action('save_post', array($this, 'save_dairy_thumbnail'));
    }

    public function get_canvas_names()
    {
        return $this->data_structure['webgl_canvas_names'];
    }

    public function add_dairy_thumbnail()
    {
        add_meta_box('dairy_thumbnail_box', 'WebGL描画のサムネイル登録', array($this, 'insert_dairy_thumbnail'), 'custom_diary', 'normal', 'high');
    }

    public function insert_dairy_thumbnail()
    {
        global $post;
        wp_nonce_field(wp_create_nonce(__FILE__), 'my_nonce');
        // テーブル表記にする
        // アイキャッチ画像をプルダウン選択
        // WebGL描画タイプリストをプルダウン選択
        echo '<label class="hidden" for="thumbnail">サムネイル</label>';
        echo '<table border="1">';
        echo '<tr>';
        echo '<th>アイキャッチ画像</th>';
        echo '<th>WebGL描画タイプ</th>';
        echo '</tr>';
        foreach ($this->field_datas as $field_data) {
            $field_data->loadAndCheckValidate($post->ID, $this->data_structure['webgl_canvas_name']);

            echo '<tr>';
            echo '<td>';

            echo '<select name="' . $field_data->get_thumbnail_id() . '">';
            foreach ($this->data_structure['thumbnail_id'] as $value) {
                if ($value == null) {
                    if (!$field_data->is_selected())
                        echo '<option value="' . 0 . '" selected>none</option>';
                    else
                        echo '<option value="' . 0 . '">none</option>';
                } else {
                    if ($field_data->is_thumbnail_selected($value->ID))
                        echo '<option value="' . $value->ID . '" selected>' . $value->post_title . '</option>';
                    else
                        echo '<option value="' . $value->ID . '">' . $value->post_title . '</option>';
                }
            }
            echo '</select>';

            echo '</td>';
            echo '<td>';

            echo '<select name="' . $field_data->get_webgl_canvas_id() . '">';
            foreach ($this->data_structure['webgl_canvas_name'] as $value) {
                if ($value === $field_data->get_webgl_canvas_data())
                    echo '<option value="' . $value . '" selected>' . $value . '</option>';
                else
                    echo '<option value="' . $value . '">' . $value . '</option>';
            }
            echo '</select>';

            echo '</td>';
            echo '</tr>';
        }
        echo '</table>';

        echo '<p>投稿項目に表示させたいサムネイルを設定してバッグ画面に表示させるWebGL描画タイプを指定できます。</p>';
    }

    public function save_dairy_thumbnail($post_id)
    {
        $my_nonce = isset($_POST['my_nonce']) ? $_POST['my_nonce'] : null;
        if (!wp_verify_nonce($my_nonce, wp_create_nonce(__FILE__))) {
            return $post_id;
        }
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return $post_id;
        }
        if (!current_user_can('edit_post', $post_id)) {
            return $post_id;
        }

        // カスタムフィールド入力内容を保存
        error_log('start save');
        foreach ($this->field_datas as $field_data) {
            $field_data->save($post_id, $_POST);
        }
        error_log('end save');
    }
}

$g_custom_field_dairy_thumbnail_inst = new CustomFieldDairyThumbnail();