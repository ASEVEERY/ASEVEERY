#version 300 es
precision highp float;

// 输入从顶点着色器传递的数据
in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoord;
in vec4 FragPosLightSpace;

// 输出最终颜色
out vec4 FragColor;

// 统一变量（材质、光源、纹理、相机）
uniform sampler2D diffuseTexture;  // 物体表面纹理
uniform sampler2D depthTexture;    // ShadowMap深度纹理
uniform vec4 u_lightPosition;      // 光源位置/方向（w=1点光源，w=0平行光）
uniform vec3 lightColor;           // 光源颜色
uniform vec3 viewPos;              // 相机位置

// 材质参数（Phong模型）
uniform float ambientKaStrength;   // 环境光强度
uniform float diffuseStrength;     // 漫反射强度
uniform float specularStrength;    // 镜面反射强度
uniform float shininess;           // 镜面反射高光系数

/*TODO3: 添加阴影计算，返回1表示是阴影，返回0表示非阴影*/
float calculateShadow() {
    // 1. 将光源空间顶点位置转换到NDC（标准化设备坐标）[-1,1]
    vec3 projCoords = FragPosLightSpace.xyz / FragPosLightSpace.w;
    // 2. 转换到纹理坐标空间[0,1]
    projCoords = projCoords * 0.5 + 0.5;
    
    // 3. 采样ShadowMap获取光源视角下的最近深度
    float closestDepth = texture(depthTexture, projCoords.xy).r;
    // 4. 当前片段在光源视角下的实际深度
    float currentDepth = projCoords.z;
    
    // 5. 深度偏移（解决阴影 acne 问题）
    vec3 normal = normalize(Normal);
    vec3 lightDir = normalize(u_lightPosition.w == 1.0 ? 
                             u_lightPosition.xyz - FragPos :  // 点光源方向
                             -u_lightPosition.xyz);          // 平行光方向
    float bias = max(0.05 * (1.0 - dot(normal, lightDir)), 0.005);
    
    // 6. 软阴影（PCF采样，8x8邻域平均）
    float shadow = 0.0;
    vec2 texelSize = 1.0 / vec2(textureSize(depthTexture, 0));
    for(int x = -4; x <= 4; ++x) {
        for(int y = -4; y <= 4; ++y) {
            float pcfDepth = texture(depthTexture, projCoords.xy + vec2(x, y) * texelSize).r;
            shadow += (currentDepth - bias > pcfDepth) ? 1.0 : 0.0;
        }
    }
    shadow /= 81.0; // 81个采样点平均
    
    // 7. 超出纹理范围的片段不计算阴影
    if(projCoords.z > 1.0) shadow = 0.0;
    
    return shadow;
}

/*TODO2: 根据phong shading方法计算ambient,diffuse,specular*/
void main() {
    // 1. 基础数据标准化
    vec3 normal = normalize(Normal);
    vec3 viewDir = normalize(viewPos - FragPos);
    
    // 2. 计算光源方向（区分点光源和平行光）
    vec3 lightDir;
    if(u_lightPosition.w == 1.0) {
        // 点光源：从片段指向光源
        lightDir = normalize(u_lightPosition.xyz - FragPos);
    } else {
        // 平行光：固定方向（光源向量取反）
        lightDir = normalize(-u_lightPosition.xyz);
    }
    
    // 3. Phong光照三组件计算
    // 3.1 环境光（Ambient）：模拟间接光照
    vec3 ambient = ambientKaStrength * lightColor;
    
    // 3.2 漫反射（Diffuse）：模拟粗糙表面的定向反射（兰伯特定律）
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diffuseStrength * diff * lightColor;
    
    // 3.3 镜面反射（Specular）：模拟光滑表面的高光（Phong模型）
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = specularStrength * spec * lightColor;
    
    // 4. 阴影计算
    float shadow = calculateShadow();
    
    // 5. 纹理采样（获取物体表面颜色）
    vec4 texColor = texture(diffuseTexture, TexCoord);
    
    // 6. 最终颜色合成（光照 + 纹理 + 阴影）
    vec3 result = (ambient + (1.0 - shadow) * (diffuse + specular)) * vec3(texColor);
    FragColor = vec4(result, texColor.a);
}