<?php

/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 * It is used to display a page when nothing more specific matches a query.
 * E.g., it puts together the home page when no home.php file exists.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package glsl-blog
 */

get_header();
?>

<!-- Navigation -->
<nav class="navbar navbar-expand-lg navbar-dark navbar-custom fixed-top">
	<div class="container">
		<div class="btn-group btn-group-toggle" data-toggle="buttons">
			<label class="btn btn-info active">
				<input type="radio" name="options" id="js_back_on_view_button" autocomplete="off">Back View On
			</label>
			<label class="btn btn-info">
				<input type="radio" name="options" id="js_back_off_view_button" autocomplete="off" checked>Back View Off
			</label>
		</div>

		<div id="canvas_param_pane" style="display: none;"></div>
	</div>
</nav>

<?php
// canvasがサイトのバッグに固定で表示できるかテスト 
// 再後面にcanvasを表示したいのでz-index:-1にしている
?>
<canvas style="position:fixed; top:0; left:0; width:100%; height:100%; margin: 0px auto; z-index:-1;" id="js-webgl-canvas">
</canvas>

<!-- #main -->
<main class="js_dairy_view" style="display: block;">
	<!-- TODO: 枠をアルファで半透明にしたい -->
	<header class="masthead text-center text-white">
		<div class="masthead-content">
			<div class="container">
				<h1 class="masthead-heading mb-0"><?php bloginfo('name'); ?></h1>
				<h2 class="masthead-subheading mb-0"><?php bloginfo('description'); ?></h2>
			</div>
		</div>
		<div class="bg-circle-1 bg-circle"></div>
		<div class="bg-circle-2 bg-circle"></div>
		<div class="bg-circle-3 bg-circle"></div>
		<div class="bg-circle-4 bg-circle"></div>
	</header>

	<?php
	// 前書き投稿
	// カスタム投稿を取得するように切り替え
	$custom_prefact_post_query_args = array(
		'post_type' => 'custom_prefact',
		'posts_per_page' => -1, //表示件数（-1で全ての記事を表示）
		// 投稿リストの表示順を古い投稿から先にする
		'order' => 'ASC',
	);
	$the_prefact_query = new WP_Query($custom_prefact_post_query_args);
	/*
	下記のサイトを参考に投稿データの種類名をした
	 https://hirashimatakumi.com/blog/5271.html
	 */
	?>
	<div class="text-center text-white">
		<div class="container">
			<h1 class="mb-0 display-4"><?php echo esc_html(get_post_type_object($the_prefact_query->query['post_type'])->label); ?></h1>
			<?php if ($the_prefact_query->have_posts()) : ?>
				<?php while ($the_prefact_query->have_posts()) : $the_prefact_query->the_post(); ?>
					<h2 class="mb-0"><?php the_content(); ?></h2>
				<?php endwhile; ?>
			<?php endif; ?>
		</div>
	</div>

	<?php
	// カスタム投稿を取得するように切り替え
	$custom_diary_post_query_args = array(
		'post_type' => 'custom_diary',
		'posts_per_page' => -1, //表示件数（-1で全ての記事を表示）
		'order' => 'ASC',
	);
	$the_query = new WP_Query($custom_diary_post_query_args);

	// 投稿記事があるかチェック have_posts()で確認可能 
	if ($the_query->have_posts()) :
	?>
		<?php
		// 存在する投稿記事をループして一つ一つ取得してタイトルと抜粋などの情報を表示
		$index = 0;
		?>
		<?php while ($the_query->have_posts()) : $the_query->the_post(); ?>
			<section>
				<div class="container text-white">
					<div class="row align-items-center">
						<div class="col-lg-6 order-lg-1">
							<div class="p-5">
								<h2 class="display-4"><?php the_title(); ?></h2>
								<p><?php the_content(); ?></p>
							</div>
						</div>

						<div class="<?php if ($index % 2) : ?>col-lg-6 order-lg-2<?php else : ?>col-lg-6 <?php endif; ?>"">
						<div class=" p-5">
							<div class="row">
								<?php
								$field_datas = [];
								for ($i = 0; $i < CustomFieldDairyThumbnail::FIELD_ITEM_MAX; ++$i)
									array_push($field_datas, new DairyThumbnailItem($i + 1));
								?>
								<?php foreach ($field_datas as $field_data) : ?>
									<?php if ($field_data->load($the_query->post->ID)) : ?>
										<div class="col-md-4">
											<div class="thumbnailImg">
												<img class="img-fluid rounded-circle border border-white" id="js-canvas-thumbnail-img" value="<?php echo esc_html($field_data->get_webgl_canvas_data()); ?>" src="<?php echo wp_get_attachment_url($field_data->get_thumbnail_data()); ?>" alt="">
											</div>
										</div>
									<?php endif; ?>
								<?php endforeach; ?>
							</div>
						</div>
					</div>

				</div>
			</section>

			<?php $index += 1; ?>
		<?php
			// 切り替えた投稿情報を元に戻す
			wp_reset_postdata();
		endwhile;
		?>
	<?php else : ?>
		<section>
			<div class="container">
				<div class="d-flex justify-content-center">
					<div class="p-5">
						<h2 class="display-4">記事がありません!</h2>
					</div>
				</div>
			</div>
		</section>
	<?php endif; ?>

	<?php
	// あとがき投稿
	// カスタム投稿を取得するように切り替え
	$custom_afterword_post_query_args = array(
		'post_type' => 'custom_afterword',
		'posts_per_page' => -1, //表示件数（-1で全ての記事を表示）
		'order' => 'ASC',
	);
	$the_afterword_query = new WP_Query($custom_afterword_post_query_args);
	?>
	<div class="text-center text-white">
		<div class="container">
			<h1 class="mb-0 display-4"><?php echo esc_html(get_post_type_object($the_afterword_query->query['post_type'])->label); ?></h1>
			<?php if ($the_afterword_query->have_posts()) : ?>
				<?php while ($the_afterword_query->have_posts()) : $the_afterword_query->the_post(); ?>
					<h2 class="mb-0"><?php the_content(); ?></h2>
				<?php endwhile; ?>
			<?php endif; ?>
		</div>
	</div>

</main><!-- #main -->

<?php
//get_sidebar();
get_footer();
