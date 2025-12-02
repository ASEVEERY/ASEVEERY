#version 300 es
precision highp float;

// 顶点属性
layout (location = 0) in vec4 vPosition;
layout (location = 1) in vec4 vNormal;
layout (location = 2) in vec2 vTexCoord;

// 输出到片段着色器的数据
out vec3 FragPos;       // 世界空间中的顶点位置
out vec3 Normal;        // 世界空间中的法向量
out vec2 TexCoord;      // 纹理坐标
out vec4 FragPosLightSpace; // 光源空间中的顶点位置（用于阴影计算）

// 统一变量（矩阵和光源）
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_LightSpaceMatrix;

void main() {
    // 计算世界空间顶点位置
    FragPos = vec3(u_ModelMatrix * vPosition);
    // 计算世界空间法向量（考虑模型变换的逆矩阵转置，避免非均匀缩放影响）
    Normal = mat3(transpose(inverse(u_ModelMatrix))) * vec3(vNormal);
    // 传递纹理坐标
    TexCoord = vTexCoord;
    // 计算光源空间顶点位置（用于ShadowMap采样）
    FragPosLightSpace = u_LightSpaceMatrix * vec4(FragPos, 1.0);
    
    // 最终顶点位置（投影矩阵*观察矩阵*模型矩阵）
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * vec4(FragPos, 1.0);
}
