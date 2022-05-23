// 入力
attribute vec3 position;

// 出力
varying vec3 v_ray;

// 頂点シェーダーメイン
void main(void)
{
    gl_Position = vec4(position, 1.0);
    v_ray = vec3( position.xy*0.4, 1.0 ); // ポジションから適当にレイを生成（ほんと適当）
}
