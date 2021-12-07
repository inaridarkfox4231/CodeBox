# include <Siv3D.hpp>

// やっとスタートライン！
// 参考：https://qiita.com/Reputeless/items/5bc7e72aa873be90e91d#3-%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%A0%E3%81%A7%E4%BD%9C%E3%81%A3%E3%81%9F-3d-%E5%BD%A2%E7%8A%B6%E3%82%92-mesh-%E3%81%A8%E3%81%97%E3%81%A6%E6%8F%8F%E7%94%BB%E3%81%99%E3%82%8B
// ここに3. プログラムで作った 3D 形状を Mesh として描画する
// 参考：https://zenn.dev/reputeless/articles/article-3d-wall
// これのコピーです・・Mainの方だけ。

MeshData CreateMeshData()
{
	const uint32 N = 400;

	Array<Vertex3D> vertices(4 * N); // ここで頂点を作るわけね

	for (uint32 i : step(N))
	{
		auto& v0 = vertices[2 * i];
		auto& v1 = vertices[2 * i + 1];
		auto& v2 = vertices[2 * N + 2 * i];
		auto& v3 = vertices[2 * N + 2 * i + 1];

		v0.tex.set(0, 0);
		v1.tex.set(0, 0);
		v0.normal.set(0, 1, 0);
		v1.normal.set(0, 1, 0);
		v2.tex.set(0, 0);
		v3.tex.set(0, 0);
		v2.normal.set(0, 1, 0);
		v3.normal.set(0, 1, 0);

		v0.pos = Vec3(Cylindrical(i * 0.01, i * 0.05, i * 0.01)); // 円柱座標ですかね・・
		v1.pos = Vec3(Cylindrical(i * 0.01, i * 0.05, 0.4 + i * 0.01));
		//v2.pos = Vec3(Cylindrical(i * 0.01, i * 0.05, i * 0.01));
		v2.pos = v0.pos;
		v3.pos = v1.pos;
	}

	Array<TriangleIndex32> indices(4 * (N - 1));

	for (uint32 i : step(N - 1))
	{
		indices[2 * i] = { 2 * i, 2 * i + 2, 2 * i + 1 };
		indices[2 * i + 1] = { 2 * i + 1, 2 * i + 2, 2 * i + 3 };
	}

	const uint32 offset = N * 2;

	// 裏面用のインデックス
	for (uint32 i : step(N - 1))
	{
		indices[2 * (N - 1) + 2 * i] = { offset + 2 * i,offset + 2 * i + 1,offset + 2 * i + 2 };
		indices[2 * (N - 1) + 2 * i + 1] = { offset + 2 * i + 1,offset + 2 * i + 3,offset + 2 * i + 2 };
	}

	MeshData meshData{ std::move(vertices), std::move(indices) };

	meshData.computeNormals();

	return meshData;
}

MeshData Triang() {
	Array<Vertex3D> vertices(3);
	Array<TriangleIndex32> indices(1);

	auto& v0 = vertices[0];
	float y = 4;
	v0.pos.set(0, y, 0);
	v0.normal.set(0, 1, 0);
	v0.tex.set(0, 0);
	auto& v1 = vertices[1];
	v1.pos.set(4, y, 0);
	v1.normal.set(0, 1, 0);
	v1.tex.set(0, 0);
	auto& v2 = vertices[2];
	v2.pos.set(0, y, 4);
	v2.normal.set(0, 1, 0);
	v2.tex.set(0, 0);
	indices[0] = { 0,2,1}; // 0,1,2だと描画されないからカリングが働いてるっぽいね・・
	// y正方向（真上）から見てz軸（奥方向）をx軸（右方向）に最短で回す向きが正の回転だから
	// そうですね時計回りが正方向ですね。表面から見て時計回り。

	MeshData meshData{ std::move(vertices), std::move(indices) };

	meshData.computeNormals();

	return meshData;
}

void Main()
{
	Window::Resize(1280, 720);
	const ColorF backgroundColor = ColorF{ 0.4, 0.6, 0.8 }.removeSRGBCurve();
	Image uvCheckerImage{ U"example/texture/grass.jpg" };
	const Texture uvChecker{ uvCheckerImage, TextureDesc::MippedSRGB };
	const MSRenderTexture renderTexture{ Scene::Size(), TextureFormat::R8G8B8A8_Unorm_SRGB, HasDepth::Yes };
	DebugCamera3D camera{ renderTexture.size(), 30_deg, Vec3{ 10, 16, -32 } };

	// triplanar 用のシェーダ
	const PixelShader ps = HLSL{ U"example/shader/hlsl/forward_triplanar.hlsl", U"PS" }
	| GLSL{ U"example/shader/glsl/forward_triplanar.frag", {{ U"PSPerFrame", 0 }, { U"PSPerView", 1 }, { U"PSPerMaterial", 3 }} };

	ColorF ambientColor = Graphics3D::DefaultGlobalAmbientColor;

	// 木材のテクスチャ
	const Texture woodTexture{ U"example/texture/wood.jpg", TextureDesc::MippedSRGB };

	// 壁のメッシュ
	const Mesh wall =  Mesh{ CreateMeshData() };
	const Mesh triang = Mesh{ Triang() };

	while (System::Update())
	{
		camera.update(2.0);
		Graphics3D::SetCameraTransform(camera);

		// 環境光を設定
		Graphics3D::SetGlobalAmbientColor(ambientColor);

		// 3D 描画
		{
			const ScopedRenderTarget3D target{ renderTexture.clear(backgroundColor) };

			Plane{ 64 }.draw(uvChecker);

			const ScopedCustomShader3D shader{ ps };

			wall.draw(woodTexture);
			// 位置指定めっちゃ簡単・・すげぇ
			// HSVで0～360で色とかいじれるわけね。
			triang.draw(4, 0, 0, HSV{ 180 }.removeSRGBCurve());

		}

		// 3D シーンを 2D シーンに描画
		{
			Graphics3D::Flush();
			renderTexture.resolve();
			Shader::LinearToScreen(renderTexture);
		}
	}
}
//
// = アドバイス =
// Debug ビルドではプログラムの最適化がオフになります。
// 実行速度が遅いと感じた場合は Release ビルドを試しましょう。
// アプリをリリースするときにも、Release ビルドにするのを忘れないように！
//
// 思ったように動作しない場合は「デバッグの開始」でプログラムを実行すると、
// 出力ウィンドウに詳細なログが表示されるので、エラーの原因を見つけやすくなります。
//
// = お役立ちリンク | Quick Links =
//
// Siv3D リファレンス
// https://zenn.dev/reputeless/books/siv3d-documentation
//
// Siv3D Reference
// https://zenn.dev/reputeless/books/siv3d-documentation-en
//
// Siv3D コミュニティへの参加
// Slack や Twitter, BBS で気軽に質問や情報交換ができます。
// https://zenn.dev/reputeless/books/siv3d-documentation/viewer/community
//
// Siv3D User Community
// https://zenn.dev/reputeless/books/siv3d-documentation-en/viewer/community
//
// 新機能の提案やバグの報告 | Feedback
// https://github.com/Siv3D/OpenSiv3D/issues
//

/*
MeshData CreateMeshData()
{
	const int32 N = 400;

	Array<Vertex3D> vertices;

	for (int32 i : step(N))
	{
		Vertex3D v;
		v.tex.set(0, 0);
		v.normal.set(0, 1, 0);

		v.pos = Vec3(Cylindrical(i * 0.01, i * 0.05, i * 0.01));
		vertices.push_back(v);

		v.pos = Vec3(Cylindrical(i * 0.01, i * 0.05, 0.4 + i * 0.01));
		vertices.push_back(v);
	}

	// 裏面用の頂点
	for (int32 i : step(N))
	{
		vertices.push_back(vertices[i * 2 + 0]);
		vertices.push_back(vertices[i * 2 + 1]);
	}

	Array<TriangleIndex32> indices(4*(N-1));

	for (uint32 i : step(N - 1))
	{

		indices[2 * i] = {2*i,2*i+2,2*i+1};
		indices[2 * i + 1] = {2*i+1,2*i+2,2*i+3};

	}

	const uint32 offset = N * 2;

	// 裏面用のインデックス
	for (uint32 i : step(N - 1))
	{

		indices[2*(N-1)+2 * i] = { offset+2 * i,offset+2 * i + 1,offset+2 * i + 2 };
		indices[2*(N-1)+2 * i + 1] = { offset+2 * i + 1,offset+2 * i + 3,offset+2 * i + 2 };

	}

	MeshData meshData{ std::move(vertices), std::move(indices) };

	meshData.computeNormals();

	return meshData;
}
*/
