// ステート定数（雑）
var STATE_TITLE = 0;
var STATE_COUNT = 1;
var STATE_IDLE  = 2;
var STATE_MOVE  = 3;
var STATE_ERASE = 4;
var STATE_POP   = 5;
var STATE_TIMEISUP = 6;

// 移動方向定数
var MOVE_UP = 0;
var MOVE_DOWN = 1;
var MOVE_LEFT = 2;
var MOVE_RIGHT = 3;

// ステート
var _state = STATE_IDLE;

// 移動座標
var _movex, _movey;
// 移動方向
var _moveway;
// 移動ダーティフラグ
var _movedirty;

// 移動カウンタ
var _movecount;
// エミッションアニメ
var _emitcount;
// 消えカウンタ
var _erasecount;
// タイトル用カウンタ
var _titlecount;
// カウントダウン用カウンタ
var _countcount;
// ゲームオーバーカウンタ
var _overcount;

// 描画用変数
var _rqgl;
var _c2d;

var _batch;
var _basecolors;

// ゲーム用変数
var _map;
var _balls;
var _score;
var _percent;
var _hiscore;
var _timer;
var _level;

// キャンバスのスケール
var _canvasscale;
var _canvaselem;

// ボール
function Ball()
{
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.size = 0.5;
    this.color = 0;
    this.vz = 0;
    this.ischecked = false;
    this.iserased = false;
    this.ismatched = false;
}

// ベクトル便利関数
function setVec3( v, x, y, z )
{
    v[0] = x; v[1] = y; v[2] = z;
}
function normalize( v )
{
    var l = Math.sqrt( v[0]*v[0]+v[1]*v[1]+v[2]*v[2] );
    v[0] /= l;
    v[1] /= l;
    v[2] /= l;
}

// スコア取得
function getScore()
{
    return _score + Math.floor(_percent*100);
}

// マップ操作
function moveLeft( x, y )
{
    var tmp = _map[0][y];
    for( var i = 0; i < 3; ++i )
    {
        _map[i][y] = _map[i+1][y];
    }
    _map[3][y] = tmp;
}
function moveRight( x, y )
{
    var tmp = _map[3][y];
    for( var i = 3; i > 0; --i )
    {
        _map[i][y] = _map[i-1][y];
    }
    _map[0][y] = tmp;
}
function moveUp( x, y )
{
    var tmp = _map[x][0];
    for( var i = 0; i < 3; ++i )
    {
        _map[x][i] = _map[x][i+1];
    }
    _map[x][3] = tmp;
}
function moveDown( x, y )
{
    var tmp = _map[x][3];
    for( var i = 3; i > 0; --i )
    {
        _map[x][i] = _map[x][i-1];
    }
    _map[x][0] = tmp;
}

// クリアチェック
function checkErase( doerase )
{
    var BORDER_TOP    = 1 << 0;
    var BORDER_BOTTOM = 1 << 1;
    var BORDER_LEFT   = 1 << 2;
    var BORDER_RIGHT  = 1 << 3;

    function check( x, y, color, info )
    {
        var idx = _map[x][y];
        if( _balls[idx].color != color ) return;
        if( _balls[idx].ischecked ) return;
        _balls[idx].ischecked = true;
        info.count++;

        if( x > 0 ) check( x-1, y, color, info );
        if( x < 3 ) check( x+1, y, color, info );
        if( y > 0 ) check( x, y-1, color, info );
        if( y < 3 ) check( x, y+1, color, info );
    }
    function erase( x, y, color )
    {
        var idx = _map[x][y];
        if( _balls[idx].color != color ) return;
        if( _balls[idx].iserased ) return;
        _balls[idx].iserased = true;

        if( x > 0 ) erase( x-1, y, color );
        if( x < 3 ) erase( x+1, y, color );
        if( y > 0 ) erase( x, y-1, color );
        if( y < 3 ) erase( x, y+1, color );
    }

    for( var ii = 0; ii < 16; ++ii )
    {
        _balls[ii].ismatched = false;
    }

    var iserased = true;
    _percent = 0;
    for( var i = 0; i < 4; ++i )
    {
        for( var j = 0; j < 4; ++j )
        {
            var idx = _map[j][i];
            var col = _balls[idx].color;
            var info = {count:0};

            check( j, i, col, info );

            var ok = true;
            for( var ii = 0; ii < 4; ++ii )
            {
                for( var jj = 0; jj < 4; ++jj )
                {
                    var idx = _map[jj][ii];
                    if( _balls[idx].color == col && _balls[idx].ischecked == false )
                    {
                        ok = false;
                        _balls[idx].ischecked = true;
                    }
                }
            }
            if( ok )
            {
                _percent += info.count;

                if( info.count > 0 )
                {
                    for( var ii = 0; ii < 16; ++ii )
                    {
                        if( _balls[ii].color == col )
                            _balls[ii].ismatched = true;
                    }
                }
            }
            else
            {
                iserased = false;
            }
        }
    }
    _percent /= 16.0;

    if( iserased )
    {
        _score += 100;
        _percent = 0;
        for( var i = 0; i < 16; ++i )
        {
            _balls[i].iserased = true;
        }
    }

    // クリア
    for( var i = 0; i < 4; ++i )
    {
        for( var j = 0; j < 4; ++j )
        {
            var idx = _map[j][i];
            _balls[idx].ischecked = false;
        }
    }

    return iserased;
}


// 入力系
function initializeInput()
{
    var elem2d = document.getElementById( "wmpcanvas2D" );

    var down = false;
    var sx = 0;
    var sy = 0;
    var mx = 0;
    var my = 0;
    window.onmouseup = function()
    {
        down = false;
    }
    function mousedownevent( e )
    {
        if( "offsetX" in e )
        {
            sx = e.offsetX;
            sy = e.offsetY;
        }
        else
        {
            var rect = _canvaselem.getBoundingClientRect() ;
            sx = e.changedTouches[0].pageX - (rect.left + window.pageXOffset);
            sy = e.changedTouches[0].pageY - (rect.top + window.pageYOffset);
        }

        if( _state == STATE_TITLE && _titlecount >= 60 &&
            sx >= 0 && sx < 512*_canvasscale && sy >= 0 && sy < 512*_canvasscale )
        {
            _state = STATE_COUNT;
            _titlecount = 0;
            _overcount = 0;
            _movedirty = false;
            _timer = 60*60*2; // 2min
        }

        if( _state != STATE_IDLE && _state != STATE_MOVE ) return;

        if( sx >= 100*_canvasscale && sy >= 100*_canvasscale && sx < (512-100)*_canvasscale && sy < (512-100)*_canvasscale )
        {
            down = true;
            mx = Math.floor( (sx - 100*_canvasscale) / ((512-200)*_canvasscale) * 4 );
            my = Math.floor( (sy - 100*_canvasscale) / ((512-200)*_canvasscale) * 4 );
        }
    }
    if( "ontouchstart" in window )
        window.ontouchstart = mousedownevent;
    else
        elem2d.onmousedown = mousedownevent;

    function mousemoveevent( e )
    {
        var ex,ey;
        if( e.offsetX !== undefined )
        {
            ex = e.offsetX;
            ey = e.offsetY;
        }
        else
        {
            var rect = _canvaselem.getBoundingClientRect() ;
            ex = e.changedTouches[0].pageX - (rect.left + window.pageXOffset);
            ey = e.changedTouches[0].pageY - (rect.top + window.pageYOffset);
        }

        if( down )
        {
            var dx = ex - sx;
            var dy = ey - sy;
            var len = dx*dx+dy*dy;
            if( len > 256*_canvasscale )
            {
                down = false;
                _movex = mx;
                _movey = my;
                if( Math.abs(dx) > Math.abs(dy) )
                {
                    if( dx > 0 )
                    {
                        _moveway = MOVE_RIGHT;
                    }
                    else
                    {
                        _moveway = MOVE_LEFT;
                    }
                }
                else
                {
                    if( dy > 0 )
                    {
                        _moveway = MOVE_DOWN;
                    }
                    else
                    {
                        _moveway = MOVE_UP;
                    }
                }
                _movedirty = true;
            }
        }
        e.preventDefault();
    }
    elem2d.onmousemove = mousemoveevent;
    elem2d.ontouchmove = mousemoveevent;
    var elemtweet = document.getElementById("wmptweet");
    elemtweet.onclick = function()
    {
        var here = window.location.href;
        var text = encodeURIComponent( "WHOLE MATCH PUZZLEで"+getScore()+"点とりました。" );
        var hashtag = "WHOLEMATCHPAZZLE";
        if( here.indexOf("techblog.sega.jp") < 0 )
        {
            alert("社内公開時はツイートを制限しています。");
            here = "";
            text = "";
            hashtag = "";
        }
        here = encodeURIComponent(here);

        var url = "https://twitter.com/intent/tweet?hashtags="+hashtag+"&url="+ here +"&text=" + text + "&related=SEGA_OFFICIAL";

        window.open( url, "_blank", 'width=640,height=400' );
    };

    var elemreturn = document.getElementById("wmpreturn");
    elemreturn.onclick = function()
    {
        elemtweet.style.display = "none";
        elemreturn.style.display = "none";
        _state = STATE_TITLE;
        // 各種初期化
        _score = 0;
        _percent = 0;
        _level = 0;
        popBalls( true );
    };
}

// バッチ生成
function initializeBatch()
{
    // シェーダー作成
    var vs = _rqgl.compileVertexShaderById( "vs" );
    var fs = _rqgl.compileFragmentShaderById( "fs" );
    var shader = _rqgl.createShaderProgram( vs, fs );

    // シェーダー定数宣言
    shader.addUniform( "spheres", _rqgl.UNIFORMTYPE_FLOAT4_ARRAY, 16 );
    shader.addUniform( "colors", _rqgl.UNIFORMTYPE_FLOAT3_ARRAY, 16 );
    shader.addUniform( "emit", _rqgl.UNIFORMTYPE_FLOAT1_ARRAY, 16 );
    shader.addUniform( "planes", _rqgl.UNIFORMTYPE_FLOAT4_ARRAY, 6 );
    shader.addUniform( "pcolors", _rqgl.UNIFORMTYPE_FLOAT3_ARRAY, 6 );
    shader.addUniform( "pemits", _rqgl.UNIFORMTYPE_FLOAT3_ARRAY, 6 );
    shader.addUniform( "posz", _rqgl.UNIFORMTYPE_FLOAT1 );
    shader.addUniform( "emitanim", _rqgl.UNIFORMTYPE_FLOAT1 );
    shader.addUniform( "dlight", _rqgl.UNIFORMTYPE_FLOAT3 );
    shader.addUniform( "dlightintensity", _rqgl.UNIFORMTYPE_FLOAT1 );

    // 頂点バッファ作成
    var vertexdata = [ -1.0, 1.0,0.0,
                        1.0, 1.0,0.0,
                       -1.0,-1.0,0.0,
                        1.0,-1.0,0.0 ];
    var vb = _rqgl.createVertexBuffer( vertexdata );

    // 印でクスバッファ作成
    var indexdata = [ 0, 1, 2, 3 ];
    var ib = _rqgl.createIndexBuffer( indexdata );

    // 頂点宣言作成
    var il = _rqgl.createInputLayout();
    il.addElement( _rqgl.ELEM_POSITION, _rqgl.TYPE_FLOAT, 3 );

    // バッチ作成
    _batch = _rqgl.createBatch( _rqgl.PRIMITIVETYPE_TRIANGLE_STRIP, vb, ib, shader, il, 4 );

    // 各種シェーダー定数作成
    _batch.Uniform.spheres = new Array(16);
    _batch.Uniform.colors = new Array(16);
    _batch.Uniform.emit = new Array(16);
    for( var i = 0; i < 16; ++i )
    {
        _batch.Uniform.spheres[i] = new Array(4);

        var x = (i % 4);
        var y = Math.floor(i / 4);
        _batch.Uniform.spheres[i][0] = x-1.5;
        _batch.Uniform.spheres[i][1] = 1.5 - y;
        _batch.Uniform.spheres[i][2] = 0.0;
        _batch.Uniform.spheres[i][3] = 0.5;

        var rnd = Math.floor( Math.random() * 4 );
        _batch.Uniform.colors[i] = new Array(3);
        setVec3( _batch.Uniform.colors[i], 0, 0, 0 );
        _batch.Uniform.emit[i] = 0.0;
    }
    _batch.Uniform.planes = new Array(6);
    _batch.Uniform.pcolors = new Array(6);
    _batch.Uniform.pemits = new Array(6);
    for( var i = 0; i < 6; ++i )
    {
        _batch.Uniform.planes[i] = new Array(4);
        _batch.Uniform.planes[i][3] = 2.0;

        _batch.Uniform.pcolors[i] = new Array(3);
        _batch.Uniform.pemits[i] = new Array(3);
    }
    setVec3( _batch.Uniform.planes[0],  1,  0,  0 );
    setVec3( _batch.Uniform.planes[1], -1,  0,  0 );
    setVec3( _batch.Uniform.planes[2],  0,  1,  0 );
    setVec3( _batch.Uniform.planes[3],  0, -1,  0 );
    setVec3( _batch.Uniform.planes[4],  0,  0, -1 );
    _batch.Uniform.planes[4][3] = 0.5;
    setVec3( _batch.Uniform.planes[5],  0,  0,  1 );
    _batch.Uniform.planes[5][3] = 5;

    setVec3( _batch.Uniform.pcolors[0], 1.0, 0.2, 0.2 );
    setVec3( _batch.Uniform.pcolors[1], 1.0, 0.2, 0.2 );
    setVec3( _batch.Uniform.pcolors[2], 0.2, 0.2, 1.0 );
    setVec3( _batch.Uniform.pcolors[3], 0.2, 0.2, 1.0 );
    setVec3( _batch.Uniform.pcolors[4], 0.2, 0.2, 0.2 );
    setVec3( _batch.Uniform.pcolors[5], 1.0, 1.0, 1.0 );

    setVec3( _batch.Uniform.pemits[0], 0.1, 0.0, 0.0 );
    setVec3( _batch.Uniform.pemits[1], 0.1, 0.0, 0.0 );
    setVec3( _batch.Uniform.pemits[2], 0.0, 0.0, 0.1 );
    setVec3( _batch.Uniform.pemits[3], 0.0, 0.0, 0.1 );
    setVec3( _batch.Uniform.pemits[4], 0.0, 0.0, 0.0 );
    setVec3( _batch.Uniform.pemits[5], 100.0, 100.0, 100.0 );

    _batch.Uniform.posz = -8.0;
    _batch.Uniform.emitanim = 1.0;

    _batch.Uniform.dlight = new Array(3);
    setVec3( _batch.Uniform.dlight, -1,-1, 2 );
    normalize( _batch.Uniform.dlight );
    _batch.Uniform.dlightintensity = 0.0;

    // 球のベースカラー
    _basecolors = new Array(6);
    for( var i = 0; i < 6; ++i )
    {
        _basecolors[i] = new Array(3);
    }
    setVec3( _basecolors[0], 0.90, 0.05, 0.05 );
    setVec3( _basecolors[1], 0.05, 0.05, 1.00 );
    setVec3( _basecolors[2], 0.05, 0.50, 0.05 );
    setVec3( _basecolors[3], 1.00, 0.50, 0.00 );
    setVec3( _basecolors[4], 0.80, 0.00, 1.00 );
    setVec3( _basecolors[5], 0.50, 0.50, 0.50 );
}

// ボール配置
function popBalls( init )
{
    var maxcolor = _level + 2;
    if( maxcolor > 5 ) maxcolor = 5;

    while( true )
    {
        for( var i = 0; i < 16; ++i )
        {
            if( _balls[i].iserased || init )
            {
                _balls[i].color = Math.floor( Math.random() * maxcolor );
            }
        }
        var ret = checkErase( false );
        if( ret === false )
        {
            for( var i = 0; i < 16; ++i )
            {
                if( _balls[i].iserased || init )
                {
                    _balls[i].iserased = false;
                    _balls[i].size = 0.5;
                    if( init )
                        _batch.Uniform.spheres[i][2] = 0;
                    else
                        _batch.Uniform.spheres[i][2] = -3.5 - Math.random() * 5;
                    _balls[i].vz = 0.0;
                }
            }
            break;
        }
    }
}

// 初期化
function initialize()
{
    _canvaselem = document.getElementById("wmpcanvases");

    // てきとうな小さな画面対応
    _canvasscale = 1.0;
    if( document.body.clientWidth < 800 )
    {
        _canvasscale = 320/512.0;
        var size=Math.floor(512*_canvasscale);
        _canvaselem.style.width = size+"px";
        _canvaselem.style.height = size+"px";
        var elem = document.getElementById( "wmpcanvas3D" );
        elem.width = size;
        elem.height = size;
        elem = document.getElementById( "wmpcanvas2D" );
        elem.width = size;
        elem.height = size;

        var elemtweet = document.getElementById("wmptweet");
        var elemreturn = document.getElementById("wmpreturn");
        size = Math.floor(150*_canvasscale);
        var top = Math.floor(390*_canvasscale);
        var fsize = Math.floor(16*_canvasscale);
        elemtweet.style.width= size+"px";
        elemtweet.style.top = top+"px"
        elemtweet.style.left = Math.floor(256*_canvasscale-176*_canvasscale)+"px"
        elemtweet.style.fontSize = fsize+"px";
        elemreturn.style.width= size+"px";
        elemreturn.style.top = top+"px"
        elemreturn.style.left = Math.floor(256*_canvasscale+32*_canvasscale)+"px"
        elemreturn.style.fontSize = fsize+"px";
    }

    _rqgl = new rqGL( "wmpcanvas3D" );
    var elem2d = document.getElementById( "wmpcanvas2D" );
    _c2d = elem2d.getContext( "2d" );

    // 入力初期化
    initializeInput();

    // バッチ生成
    initializeBatch();

    // マップ初期化
    _map = new Array(4);
    for( var i = 0; i < 4; ++i )
    {
        _map[i] = new Array(4);
        for( var j = 0; j < 4; ++j )
        {
            _map[i][j] = j * 4 + i;
        }
    }

    // ゲーム初期化
    _level = 0;
    _score = 0;
    _percent = 0;
    _hiscore = 0;
    _movedirty = false;
    _movecount = 0;
    _emitcount = 0;
    _erasecount = 0;
    _titlecount = 0;
    _countcount = 0;
    _overcount = 0;

    // ハイスコア読み込み
    if( "wmpHiscore" in localStorage )
    {
        _hiscore = localStorage.wmpHiscore;
    }

    // ボールオブジェクト初期化
    _balls = new Array(16);
    for( var i = 0; i < 16; ++i )
    {
        _balls[i] = new Ball();
        _balls[i].x = (i%4) - 1.5;
        _balls[i].y = Math.floor(i/4) - 1.5;
        _balls[i].z = 0;
        _balls[i].color = Math.floor(Math.random() * 5);
        _balls[i].iserased = true;
    }
    popBalls( true );

    // 開始ステート
    _state = STATE_TITLE;

    // メインループ
    requestAnimationFrame( main );
}
window.addEventListener( "load", initialize );

// 更新
function update()
{
    // ライトの目標明るさ
    var dlightintensitytarget = 5.0;

    // ゲームのステート更新
    switch( _state )
    {
    default:
    case STATE_TITLE:
        var tcnt = _titlecount;
        if( tcnt > 60 ) tcnt = 60;
        _batch.Uniform.posz = -8.0 - ((Math.cos( tcnt / 60.0 * 3.1415926 ) * 0.5 + 0.5) * 8);
        _titlecount++;
        if( _titlecount >= 120 )
        {
            _titlecount = 60;
        }
        dlightintensitytarget = 0.1;
        break;
    case STATE_COUNT:
        _countcount++;
        if( _countcount == 60*3 )
        {
            _state = STATE_IDLE;
            _countcount = 0;
        }
        break;
    case STATE_IDLE:
        if( _movedirty )
        {
            _movedirty = false;
            switch( _moveway )
            {
            case MOVE_UP:
                moveUp( _movex, _movey );
                break;
            case MOVE_DOWN:
                moveDown( _movex, _movey );
                break;
            case MOVE_LEFT:
                moveLeft( _movex, _movey );
                break;
            case MOVE_RIGHT:
                moveRight( _movex, _movey );
                break;
            }
            _state = STATE_MOVE;
        }
        break;
    case STATE_MOVE:
        {
            _movecount++;
            if( _movecount == 15 )
            {
                _movecount = 0;

                var ret = checkErase( true );
                if( ret === true )
                {
                    _state = STATE_ERASE;
                }
                else
                {
                    _state = STATE_IDLE;
                }
            }
        }
        break;
    case STATE_ERASE:
        {
            for( var i = 0; i < 16; ++i )
            {
                if( _balls[i].iserased )
                {
                    _balls[i].size = Math.cos( _erasecount/30.0*3.1415926*0.5 ) * 0.5; //0.5 - 0.5 * (_erasecount/30.0);
                }
            }
            _erasecount++;
            if( _erasecount == 30 )
            {
                _erasecount = 0;
                _level++;
                popBalls( false );
                _state = STATE_POP;
            }
            break;
        }
    case STATE_POP:
        {
            _movecount++;
            if( _movecount == 10 )
            {
                _movecount = 0;

                _state = STATE_IDLE;
            }
        }
        break;
    case STATE_TIMEISUP:
        dlightintensitytarget = 0.1;
        break;
    }

    // ゲーム中のタイムカウンタ更新
    if( _state >= STATE_IDLE && _state < STATE_POP )
    {
        _timer--;
        if ( _timer == 0 )
        {
            _state = STATE_TIMEISUP;
            _overcount = 0;
            var result = getScore();
            if( _hiscore < result )
            {
                _hiscore = result;
                // localStorageに保存
                localStorage.wmpHiscore = _hiscore;
            }
        }
    }

    // ライトの明るさアニメーション
    _batch.Uniform.dlightintensity += (dlightintensitytarget - _batch.Uniform.dlightintensity)*0.05;

    // 球の移動アニメーションなど
    for( var i = 0; i < 4; ++i )
    {
        for( var j = 0; j < 4; ++j )
        {
            var idx = _map[j][i];
            _batch.Uniform.colors[idx] = _basecolors[_balls[idx].color];
            var x = _batch.Uniform.spheres[idx][0];
            var y = _batch.Uniform.spheres[idx][1];
            var z = _batch.Uniform.spheres[idx][2];
            var tgtx = j - 1.5;
            var tgty = 1.5 - i;
            var vx = (tgtx - x);
            var vy = (tgty - y);
            x += vx * 0.25;
            y += vy * 0.25;
            if( (Math.abs( vx ) > 2.0 || Math.abs( vy ) > 2.0) && _balls[idx].vz === 0.0 )
            {
                _balls[idx].vz = -0.5;
            }
            z += _balls[idx].vz;
            _balls[idx].vz += 0.10;
            if( z > 0.0 )
            {
                z = 0.0;
                _balls[idx].vz = -_balls[idx].vz * 0.2;
                if( _balls[idx].vz > -0.1 ) _balls[idx].vz = 0.0;
            }
            _batch.Uniform.spheres[idx][0] = x;
            _batch.Uniform.spheres[idx][1] = y;
            _batch.Uniform.spheres[idx][2] = z;
            _batch.Uniform.spheres[idx][3] = _balls[idx].size;

            if( _balls[idx].ismatched === true )
            {
                _batch.Uniform.emit[idx] = 6.0;
            }
            else
            {
                _batch.Uniform.emit[idx] = 0.0;
            }
        }
    }

    // エミッションのアニメーション
    _batch.Uniform.emitanim = Math.cos( _emitcount * 3.1415926 / 30 ) * 0.5 + 0.5;
    _emitcount = (_emitcount+1) % 60;
}

// 2D描画
function draw2D()
{
    _c2d.clearRect( 0,0,512,512 );

    switch( _state )
    {
    default:
    case STATE_TITLE:
        // タイトル
        _c2d.fillStyle = "rgba(0,0,0,0.4)";
        _c2d.fillRect(0,256*_canvasscale-48*_canvasscale,512*_canvasscale,96*_canvasscale);

        _c2d.font = 16*_canvasscale + "px 'Meiryo'";
        _c2d.textAlign = "center";
        _c2d.textBaseline = "middle";
        _c2d.fillStyle = "rgba(255,255,255,1.0)";
        _c2d.fillText( "すべての色をつなげよう", 256*_canvasscale, 235*_canvasscale, 512*_canvasscale );

        _c2d.font = "bold "+32*_canvasscale+"px 'Meiryo'";
        _c2d.textAlign = "center";
        _c2d.fillText( "WHOLE MATCH PUZZLE", 256*_canvasscale, 270*_canvasscale, 512*_canvasscale );

        _c2d.fillStyle = "rgba(255,255,255,1.0)";
        _c2d.font = 16*_canvasscale+"px 'Meiryo'";
        if( (_titlecount % 60) < 30 )
            _c2d.fillText( "Touch to start", 256*_canvasscale, 320*_canvasscale, 512*_canvasscale );
        _c2d.fillText( "(C)SEGA", 256 *_canvasscale, (512-10)*_canvasscale, 512*_canvasscale );
        if( _hiscore > 0 )
        {
            _c2d.font = 20*_canvasscale+"px 'Meiryo'";
            _c2d.textBaseline = "top";
            _c2d.fillText( "HIGH SCORE "+_hiscore, 256*_canvasscale, 8*_canvasscale, 512*_canvasscale );
        }
        break;

    case STATE_COUNT:
        // カウントダウン
        _c2d.font = "bold " + 100*_canvasscale+ "px 'Meiryo'";
        _c2d.textAlign = "center";
        _c2d.textBaseline = "middle";
        _c2d.fillStyle = "rgba(255,255,255,1.0)";

        _c2d.fillText( ""+(3-Math.floor(_countcount / 60)), 256*_canvasscale, 256*_canvasscale, 512*_canvasscale );

        // break; // score と time も表示したいのでbreakしない。
    case STATE_IDLE:
    case STATE_MOVE:
    case STATE_ERASE:
    case STATE_POP:
    case STATE_TIMEISUP:
        // スコア・タイムなど
        var overanim = Math.sin(_overcount*3.1415926/40);
        var fsize = Math.floor( (20 + overanim*16) *_canvasscale );
        _c2d.fillStyle = "rgba(255,255,255,1.0)";
        _c2d.font = fsize + "px 'Meiryo'";
        _c2d.textAlign = "center";
        _c2d.textBaseline = "top";
        var score = getScore();
        _c2d.fillText( "SCORE " + score, 256*_canvasscale, (8+overanim*40)*_canvasscale, 512*_canvasscale );
        if( score && score == _hiscore && _state == STATE_TIMEISUP )
        {
            _c2d.font = 16*_canvasscale+"px 'Meiryo'";
            _c2d.fillText( "You got a high score.", 256*_canvasscale, 100*_canvasscale, 512*_canvasscale );
        }
        _c2d.font = 20*_canvasscale+"px 'Meiryo'";
        var min = Math.floor( _timer / 3600 );
        var sec = Math.floor( (_timer % 3600) / 60 );
        var csec = Math.floor( ((_timer % 3600) % 60) * 100 / 60 );
        _c2d.fillText( "TIME " + min + "'" + ("0"+sec).slice(-2) + "'" + ("0"+csec).slice(-2) , 256*_canvasscale, 512*_canvasscale-32*_canvasscale, 512*_canvasscale );

        if( _state == STATE_TIMEISUP )
        {
            if( _overcount < 20)
            {
                _overcount++;
                if( _overcount == 20 )
                {
                    var elem = document.getElementById("wmptweet");
                    elem.style.display = "block";
                    elem = document.getElementById("wmpreturn");
                    elem.style.display = "block";
                }
            }
            _c2d.font = "bold "+60*_canvasscale+"px 'Meiryo'";
            _c2d.textAlign = "center";
            _c2d.textBaseline = "middle";
            _c2d.fillStyle = "rgba(255,255,255,1.0)";
            _c2d.fillText( "TIME IS UP", 256*_canvasscale, 256*_canvasscale, 512*_canvasscale );
        }
        break;
    }
}

// メインループ
function main()
{
    // 更新
    update();

    // 3D描画
    _rqgl.setClearColor( 1,0,0,1 );
    _rqgl.clear();

    _rqgl.draw( _batch );

    // 2D描画
    draw2D();

    // ループ
    requestAnimationFrame( main );
}
