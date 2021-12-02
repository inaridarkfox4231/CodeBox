// mediumpでいい
// 使わないuniformを削除
// Directionalも1つだけで・・
// とりあえずpointやらspecularやらemissiveやらそういうの全部カットして
// そういうのをべつのvertやfragで書いてとりあえず実用に・・
// うん。directionalとambientだけ残す感じで。
// まあshininessだけ残してもいいよ。おわり。

precision mediump float;

uniform mat4 uViewMatrix;

uniform vec3 uLightingDirection;
uniform vec3 uDirectionalDiffuseColor;

const float diffuseFactor = 0.73;

// _lightはこれで。
vec3 totalLight(vec3 modelPosition, vec3 normal){
  vec3 result = vec3(0.0); // 0.0で初期化

  vec3 viewDirection = normalize(-modelPosition);

  // DirectionalLight項の計算。
  vec3 lightVector = (uViewMatrix * vec4(uLightingDirection, 0.0)).xyz;
  vec3 lightColor = uDirectionalDiffuseColor;
  vec3 lightDir = normalize(lightVector);
  float diffuse = max(0.0, dot(-lightDir, normal));
  result += diffuse * lightColor;
  result *= diffuseFactor;

  return result;
}
// include lighting.glsl
uniform vec4 uMaterialColor;
uniform bool uUseMaterialColor; // デフォルトで0になってる。これをtrueにしてfillで指定した色を使えるようにする感じかなぁ。
// つまり指定しなければ頂点色がそのまま使われるってわけね。

varying vec4 vVertexColor;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vAmbientColor;

void main(void){
  vec3 diffuse = totalLight(vViewPosition, normalize(vNormal));
  vec4 col;

  if(uUseMaterialColor) {
    col = uMaterialColor;  // uMaterialColor単色
  }else{
    col = vVertexColor; // 頂点色
  }
  // diffuseの分にambient成分を足してrgbに掛けて色を出してspecular成分を足して完成みたいな（？？）
  col.rgb *= (diffuse + vAmbientColor);
  gl_FragColor = col;
}
