// mediumpでいい
// texture使わないのでカット
// uAmbientColorは1つでいい

precision mediump float;

attribute vec3 aPosition;
attribute vec4 aVertexColor;
attribute vec3 aNormal;

uniform vec3 uAmbientColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

varying vec4 vVertexColor;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vAmbientColor;

void main(void){
  // 場合によってはaPositionをいじる（頂点位置）
  // 場合によってはaNormalもここで計算するかもしれない
  vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);

  // Pass varyings to fragment shader
  vViewPosition = viewModelPosition.xyz;
  gl_Position = uProjectionMatrix * viewModelPosition;

  vNormal = uNormalMatrix * aNormal;
  vVertexColor = aVertexColor;

  vAmbientColor = uAmbientColor;
}
