// ---------------------------------------------------------------------------------------- //
// system constants.

const EMPTY_SLOT = Object.freeze(Object.create(null)); // ダミーオブジェクト

// 衝突判定用フラグ(collisionFlag)
const OFF = 0;  // たとえばボスとかフラグをオフにしたうえで大きいパーティクル作る、とか出来る（予定）
const ENEMY_BULLET = 1;
const PLAYER_BULLET = 2;
const ENEMY = 3;
const PLAYER = 4;

const STAR_FACTOR = 2.618033988749895; // 1 + 2 * cos(36).
// cosとsinの0, 72, 144, 216, 288における値
const COS_PENTA = [1, 0.30901699437494745, -0.8090169943749473, -0.8090169943749473, 0.30901699437494745];
const SIN_PENTA = [0, 0.9510565162951535, 0.5877852522924732, -0.587785252292473, -0.9510565162951536];
const ROOT_THREE_HALF = 0.8660254037844386; // √3/2.

// --------------------------------------------------------------------------------------- //
// main constants.

// キャンバスサイズ
const CANVAS_W = 480;
const CANVAS_H = 640;

// ステージ数
const MAX_STAGEID = 3;

// KEYCODE定数
// ああなるほど、これシステム側に書かないといけないんだ・・・

const K_ENTER = 13;
const K_RIGHT = 39;
const K_LEFT = 37;
const K_UP = 38;
const K_DOWN = 40;
const K_SPACE = 32;
const K_SHIFT = 16; // シフトキー。
const K_CTRL = 17; // コントロールキー。今回はこれをポーズに使う。

// INFはsystem内で使う
const INF = Infinity; // 長いので
// パターンのデフォルトだけどまあそのうち・・うん、
const DEFAULT_PATTERN_INDEX = 0;
// フラグ
const IS_IN_BATTLE = 0;
const IS_CLEAR = 1;
const IS_GAMEOVER = 2;

// --------------------------------------------------------------------------------------- //
// component constants.
// ボタン関連など

const BUTTON_EXPAND_DURATION = 15; // ボタンが大きくなるまでにかかるフレーム数
const BUTTON_EXPAND_RATIO = 1.1; // ボタンが大きくなるのでその比率
