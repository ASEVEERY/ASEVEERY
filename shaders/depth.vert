#version 300 es
precision highp float;

layout (location = 0) in vec4 vPosition;

uniform mat4 u_ModelMatrix;
uniform mat4 u_LightSpaceMatrix;

void main() {
    // 输出光源空间中的顶点位置（用于深度纹理采样）
    gl_Position = u_LightSpaceMatrix * u_ModelMatrix * vPosition;
}