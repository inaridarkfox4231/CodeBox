precision mediump float;

// 頂点シェーダーからの入力
varying vec3 v_ray;

// シェーダー定数
uniform vec4 spheres[16];
uniform vec3 colors[16];
uniform float emit[16];
uniform vec4 planes[6];
uniform vec3 pcolors[6];
uniform vec3 pemits[6];
uniform float posz;
uniform float emitanim;
uniform vec3 dlight;
uniform float dlightintensity;

// 一部マテリアル設定はハードコード
#define REFLECTIONRATE 0.03
#define ROUGH 0.07
#define WALLREFLECTIONRATE 0.03

// 平行光への遮蔽を取得
float getShadow( vec3 ray, vec3 pos )
{
    float depth = 1000.0;
    for( int i = 0; i < 16; ++i )
    {
        vec3 v = spheres[i].xyz - pos;
        float d = dot( v, ray );
        if( d > 0.0 )
        {
            vec3 p = ray * d + pos;
            v = spheres[i].xyz - p;
            float len = length( v );

            if( len < spheres[i].w )
            {
                depth = 0.0; // いろいろと省略
            }
        }
    }
    return ( depth < 1000.0 )?0.0:1.0;
}

// レイのヒットした結果
struct HitResult
{
    vec3 nrm;
    vec3 col;
    vec3 pos;
    vec3 emi;
    float depth;
};

// レイと球の衝突
HitResult castRayToSpheres( vec3 ray, vec3 pos )
{
    HitResult res;
    res.depth = 1000.0;

    for( int i = 0; i < 16; ++i )
    {
        vec3 v = spheres[i].xyz - pos;
        float d = dot( v, ray );
        if( d > 0.0 )
        {
            vec3 p = ray * d + pos;
            v = spheres[i].xyz - p;
            float len = length( v );

            if( len < spheres[i].w )
            {
                len = len / spheres[i].w;
                d = sqrt(-len*len + 1.0*1.0) * spheres[i].w;
                p = p - ray * d;
                len = dot( p, ray );
                if( len < res.depth )
                {
                    res.pos = p;
                    res.depth = len;
                    res.nrm = normalize( p - spheres[i].xyz );
                    res.col = colors[i];
                    res.emi = colors[i] * emit[i] * emitanim;
                }
            }
        }
    }
    return res;
}

// レイと無限平面の衝突
HitResult castRayToPlanes( vec3 ray, vec3 pos )
{
    HitResult res;
    res.depth = 1000.0;

    for( int i = 0; i < 5; ++i ) // 天井はいいや
    {
        float cost = dot( -planes[i].xyz, ray );
        if( cost > 0.0 )
        {
            vec3 pcenter = (-planes[i].xyz * planes[i].w);

            vec3 v0 = pcenter - pos;
            float d = dot( v0, -planes[i].xyz );

            float sect = 1.0 / cost;
            float l = sect * d;

            vec3 p = pos + ray * l;
            if( l < res.depth )
            {
                res.depth = l;
                res.pos = p;
                res.nrm = planes[i].xyz;
                res.col = pcolors[i];
                res.emi = pemits[i];
            }
        }
    }
    return res;
}

// 球をシェーディング
vec3 shadeSphere( vec3 ray, HitResult res, vec3 refcol )
{
    vec3 ret;

    vec3 halfv = normalize( dlight + ray );
    float shadow = getShadow( -dlight ,res.pos );
    float dn = max( dot( -res.nrm, dlight ), 0.0 );
    float fresnel = REFLECTIONRATE + (1.0 - REFLECTIONRATE) * exp( -6.0 * dot( -res.nrm, ray ) );
    float dh = dot( -res.nrm, halfv );
    ret = max( dn, 0.0 ) / 3.1415926 * res.col * (1.0 - REFLECTIONRATE) * dlightintensity * shadow;
    float cs = max( dh*dh, 0.001 );
    float ts = (1.0-cs)/cs;
    float tmp = ROUGH/(cs*(ROUGH*ROUGH+ts));
    ret += (1.0/3.1415926) * tmp*tmp * REFLECTIONRATE * dlightintensity * shadow;
    ret += refcol * fresnel;
    ret += res.emi;

    return ret;
}

// 平面をシェーディング
vec3 shadePlane( vec3 ray, HitResult res, vec3 refcol )
{
    vec3 ret;

    vec3 halfv = normalize( dlight + ray );
    float dn = dot( -res.nrm, dlight );
    float shadow = getShadow( -dlight ,res.pos );
    float dh = max( dot( -res.nrm, halfv ), 0.0 );
    float fresnel = WALLREFLECTIONRATE + (1.0 - WALLREFLECTIONRATE) * exp( -6.0 * dot( -res.nrm, ray ) );
    ret = max( dn, 0.0 ) / 3.1415926 * res.col * (1.0 - WALLREFLECTIONRATE) * dlightintensity * shadow;
    ret += refcol * fresnel;
    ret += res.emi;
    return ret;
}

// 三次反射
vec3 ray3( vec3 ray, vec3 pos )
{
    HitResult res = castRayToSpheres( ray, pos );

    vec3 ret = vec3( 0.0, 0.0, 0.0 );

    if( res.depth < 1000.0 )
    {
        ret = shadeSphere( ray, res, vec3(0.0,0.0,0.0) );
    }
    else
    {
        res = castRayToPlanes( ray, pos );

        ret = shadePlane( ray, res, vec3(0.0,0.0,0.0) );
    }

    return ret;
}

// 二次反射
vec3 ray2( vec3 ray, vec3 pos )
{
    HitResult res = castRayToSpheres( ray, pos );

    vec3 ret = vec3( 0.0, 0.0, 0.0 );

    if( res.depth < 1000.0 )
    {
        vec3 refray = reflect( ray, res.nrm );
        vec3 refcol = ray3( refray, res.pos );
        ret = shadeSphere( ray, res, refcol );
    }
    else
    {
        res = castRayToPlanes( ray, pos );

        vec3 refray = reflect( ray, res.nrm );
        vec3 refcol = ray3( refray, res.pos );
        ret = shadePlane( ray, res, refcol );
    }
    return ret;
}

// 一次反射
vec3 ray1( vec3 ray, vec3 pos )
{
    HitResult res = castRayToSpheres( ray, pos );

    vec3 ret = vec3( 0.0, 0.0, 0.0 );

    if( res.depth < 1000.0 )
    {
        vec3 refray = reflect( ray, res.nrm );
        vec3 refcol = ray2( refray, res.pos );
        ret = shadeSphere( ray, res, refcol );
    }
    else
    {
        res = castRayToPlanes( ray, pos );

        vec3 refray = reflect( ray, res.nrm );
        vec3 refcol = ray2( refray, res.pos );
        ret = shadePlane( ray, res, refcol );
    }

    return ret;
}

// ピクセルシェーダーメイン
void main(void)
{
    vec3 ray = v_ray;

    // 魚眼化（魚眼じゃなくていいならnormalize(v_ray)でよい）
    ray.xy = v_ray.xy;
    ray.z = sqrt( 1.0-v_ray.x*v_ray.x-v_ray.y*v_ray.y );

    // レイトレース
    vec3 ret = ray1( ray, vec3( 0.0, 0.0, posz ) );

    // ポストエフェクト的処理
    // トーンマップ
    ret = 1.0 - exp( -0.8 * ret );

    // 色調補正&ガンマ補正
    ret += vec3(0.0,0.0,0.1);
    ret = pow( ret, vec3(0.8/2.2,1.0/2.2,1.4/2.2));

    // 出力
    gl_FragColor.xyz = ret;
    gl_FragColor.w = 1.0;
}
