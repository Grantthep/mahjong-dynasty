/**
 * All player-facing text. English is the source of truth: every other language must provide the
 * same keys (enforced by the type below and by i18n.test.ts). `{name}` marks a placeholder.
 */
export const en = {
  'lang.name': 'English',
  'lang.label': 'Language',

  // shared chrome
  'common.demoMode': 'DEMO MODE',
  'common.demoFooter':
    'Virtual DEMO CREDITS only · no deposits, withdrawals, payments or real-money wagering',
  'common.loading': 'Loading…',
  'common.backToGame': 'Back to game',
  'common.demoCredits': 'DEMO CREDITS',
  'common.homeLink': 'Mahjong Dynasty home',
  'common.close': 'Close',
  'common.demoDisclaimer':
    'This game uses virtual DEMO CREDITS only. There are no deposits, withdrawals, payments or real-money wagering.',
  'common.notCertified': 'FOR DEVELOPMENT / DEMONSTRATION ONLY. NOT CERTIFIED GAME MATH.',

  // status screens
  'status.enterPalace': 'Entering the palace…',
  'status.preparing': 'Preparing the palace…',
  'status.error': 'Something went wrong',
  'status.tryAgain': 'Try again',
  'status.loadProfile': 'Loading your profile…',
  'status.loadFailed': 'Could not load the game.',
  'status.startFailed': 'The game could not start.',
  'status.unexpected': 'Unexpected error. Please try again.',

  // not found
  'notFound.title': 'Lost in the palace',
  'notFound.lead': 'This page does not exist.',
  'notFound.back': 'Return to the entrance',

  // game HUD
  'hud.balance': 'DEMO BALANCE',
  'hud.win': 'WIN',
  'hud.bet': 'BET',
  'hud.controls': 'Game controls',
  'hud.spin': 'SPIN',
  'hud.freeSpin': 'FREE SPIN',
  'hud.spinAria': 'Spin',
  'hud.freeSpinAria': 'Free spin',
  'hud.increaseBet': 'Increase bet',
  'hud.decreaseBet': 'Decrease bet',
  'hud.autoSpin': 'AUTO SPIN',
  'hud.stopAuto': 'STOP AUTO',
  'hud.turbo': 'TURBO',
  'hud.autoCount': 'Number of auto spins',
  'hud.autoSpins': '{count} spins',
  'hud.untilStopped': 'Until stopped',
  'hud.autoOn': 'AUTO SPIN ON',
  'hud.left': '{count} left',
  'hud.freeLeft': '{count} free spins left',
  'hud.freeRemaining': 'FREE SPINS · {count} REMAINING',
  'hud.betLocked': '(bet locked at {bet})',
  'hud.cannotAfford': 'Not enough DEMO CREDITS for this bet. Lower your bet.',
  'hud.demoOnly': 'DEMO MODE · DEMO CREDITS ONLY',
  'hud.autoStopped': 'Auto spin stopped: not enough DEMO CREDITS for this bet.',

  // overlays
  'win.big': 'BIG WIN',
  'win.mega': 'MEGA WIN',
  'win.epic': 'EPIC WIN',
  'win.freeComplete': 'FREE SPINS COMPLETE',
  'win.freeTotal': 'Total won during Free Spins',
  'win.continue': 'Click to continue',
  'wild.reelBanner': 'WILD REEL RESPIN',
  'canvas.freeSpins': 'FREE SPINS',
  'canvas.oneMore': 'ONE MORE LOTUS…',
  'canvas.awarded': '{count} AWARDED',
  'canvas.retrigger': '+{count} AWARDED',

  // settings
  'settings.title': 'Settings',
  'settings.close': 'Close settings',
  'settings.playingAs': 'Playing as {name}',
  'settings.sound': 'Sound',
  'settings.soundOn': 'Sound on',
  'settings.master': 'Master volume',
  'settings.music': 'Music',
  'settings.effects': 'Effects',
  'settings.profile': 'Profile & history',
  'settings.paytable': 'Paytable',
  'settings.about': 'About',
  'settings.note': 'Virtual DEMO CREDITS only. No deposits, withdrawals or real-money wagering.',
  'game.settings': 'Settings',
  'game.mute': 'Mute sound',
  'game.unmute': 'Unmute sound',
  'game.paytable': 'Paytable',

  // paytable
  'paytable.title': 'Paytable',
  'paytable.lead':
    'Credits paid per way at your bet, by number of reels matched. Cascade multipliers are applied on top.',
  'paytable.bet': 'Bet',
  'paytable.symbol': 'Symbol',
  'paytable.reels': '{count} reels',
  'paytable.failed': 'Could not load the paytable. Is the API running?',
  'paytable.rounding': 'Wins are added up and rounded to whole credits.',

  // about
  'about.title': 'About Mahjong Dynasty',
  'about.lead':
    'A mystical, ancient Chinese-inspired Mahjong palace where a Golden Dragon controls fortune. This is a full-stack browser demo: the server decides every result, the browser only animates it.',
  'about.howTo': 'How it plays',
  'about.ways':
    'Ways to win.| Match a symbol on 3 or more adjacent reels starting from the leftmost reel. Every matching tile on a reel multiplies your ways.',
  'about.cascades':
    'Cascading wins.| Winning tiles vanish, the rest fall and new tiles drop in. Each consecutive cascade raises the multiplier ({ladder}).',
  'about.dragon':
    'Dragon Fortune.| Every winning cascade fills the meter. At 100% the Golden Dragon sweeps the board and turns 3–6 tiles into Wilds.',
  'about.wilds': 'Golden Wilds| substitute for every regular symbol (not for the Lotus).',
  'about.wildReel':
    'Wild Reel Respin.| When a Golden Wild lands, its whole reel can lock as Wilds while the other reels respin once.',
  'about.free':
    'Free Spins.| Land 3 or more Lotus Scatters anywhere. {awards}. Free Spins use bigger multipliers ({ladder}), and your progress is saved even if you refresh.',
  'about.lotus': '{min}{plus} Lotus = {spins} spins',

  // profile
  'profile.balance': 'Demo Balance',
  'profile.totalSpins': 'Total Spins',
  'profile.totalBet': 'Total Demo Credits Bet',
  'profile.totalWon': 'Total Demo Credits Won',
  'profile.largest': 'Largest Demo Win',
  'profile.freeTriggered': 'Free Spins Triggered',
  'profile.dragonTriggers': 'Dragon Fortune Triggers',
  'profile.member': 'member since {date}',
  'profile.recent': 'Recent Spins',
  'profile.none': 'No spins yet. Head to the game and press SPIN.',
  'profile.time': 'Time',
  'profile.colBet': 'Bet',
  'profile.colWin': 'Win',
  'profile.cascades': 'Cascades',
  'profile.colBalance': 'Balance',
  'profile.notes': 'Notes',
  'profile.tagFree': 'FREE SPIN',
  'profile.tagAwarded': '+{count} FREE SPINS',
  'profile.tagDragon': 'DRAGON',

  // navigation
  'nav.leaderboard': 'Leaderboard',

  // leaderboard
  'leaderboard.title': 'Top demo wins',
  'leaderboard.lead':
    'The biggest single-spin wins of all players. Virtual DEMO CREDITS only; only usernames are shown.',
  'leaderboard.period': 'Period',
  'leaderboard.all': 'All time',
  'leaderboard.day': 'Last 24 hours',
  'leaderboard.rank': 'Rank',
  'leaderboard.player': 'Player',
  'leaderboard.win': 'Win',
  'leaderboard.bet': 'Bet',
  'leaderboard.multiple': 'Multiple',
  'leaderboard.when': 'When',
  'leaderboard.you': 'YOU',
  'leaderboard.free': 'FREE SPIN',
  'leaderboard.empty': 'No wins yet. Be the first!',
  'leaderboard.failed': 'Could not load the leaderboard.',

  // symbols
  'symbol.circle': 'Circle',
  'symbol.bamboo': 'Bamboo',
  'symbol.character': 'Character',
  'symbol.five-character': 'Five Character',
  'symbol.eight-character': 'Eight Character',
  'symbol.east-wind': 'East Wind',
  'symbol.white-dragon': 'White Dragon',
  'symbol.green-dragon': 'Green Dragon',
  'symbol.red-dragon': 'Red Dragon',
  'symbol.wild-dragon': 'Golden Dragon Wild',
  'symbol.lotus-scatter': 'Lotus Scatter',
} as const;

export type TranslationKey = keyof typeof en;
export type Translations = Record<TranslationKey, string>;

export const zh: Translations = {
  'lang.name': '中文',
  'lang.label': '语言',

  'common.demoMode': '演示模式',
  'common.demoFooter': '仅限虚拟演示积分 · 无充值、提现、支付或真钱投注',
  'common.loading': '加载中…',
  'common.backToGame': '返回游戏',
  'common.demoCredits': '演示积分',
  'common.homeLink': '麻将王朝首页',
  'common.close': '关闭',
  'common.demoDisclaimer': '本游戏仅使用虚拟演示积分，不涉及充值、提现、支付或真钱投注。',
  'common.notCertified': '仅供开发与演示使用，游戏数学模型未经认证。',

  'status.enterPalace': '正在进入宫殿…',
  'status.preparing': '正在准备宫殿…',
  'status.error': '出错了',
  'status.tryAgain': '重试',
  'status.loadProfile': '正在加载个人资料…',
  'status.loadFailed': '无法加载游戏。',
  'status.startFailed': '游戏无法启动。',
  'status.unexpected': '发生意外错误，请重试。',

  'notFound.title': '迷失在宫殿中',
  'notFound.lead': '此页面不存在。',
  'notFound.back': '回到入口',

  'hud.balance': '演示余额',
  'hud.win': '赢取',
  'hud.bet': '投注',
  'hud.controls': '游戏控制',
  'hud.spin': '旋转',
  'hud.freeSpin': '免费旋转',
  'hud.spinAria': '旋转',
  'hud.freeSpinAria': '免费旋转',
  'hud.increaseBet': '增加投注',
  'hud.decreaseBet': '减少投注',
  'hud.autoSpin': '自动旋转',
  'hud.stopAuto': '停止自动',
  'hud.turbo': '极速',
  'hud.autoCount': '自动旋转次数',
  'hud.autoSpins': '{count} 次',
  'hud.untilStopped': '直到停止',
  'hud.autoOn': '自动旋转中',
  'hud.left': '剩余 {count} 次',
  'hud.freeLeft': '剩余 {count} 次免费旋转',
  'hud.freeRemaining': '免费旋转 · 剩余 {count} 次',
  'hud.betLocked': '（投注锁定为 {bet}）',
  'hud.cannotAfford': '演示积分不足，请降低投注。',
  'hud.demoOnly': '演示模式 · 仅限演示积分',
  'hud.autoStopped': '自动旋转已停止：演示积分不足以支付当前投注。',

  'win.big': '大赢',
  'win.mega': '巨赢',
  'win.epic': '史诗大赢',
  'win.freeComplete': '免费旋转结束',
  'win.freeTotal': '免费旋转期间总赢取',
  'win.continue': '点击继续',
  'wild.reelBanner': '百搭卷轴重转',
  'canvas.freeSpins': '免费旋转',
  'canvas.oneMore': '再来一朵莲花…',
  'canvas.awarded': '获得 {count} 次',
  'canvas.retrigger': '再获得 {count} 次',

  'settings.title': '设置',
  'settings.close': '关闭设置',
  'settings.playingAs': '当前玩家：{name}',
  'settings.sound': '声音',
  'settings.soundOn': '开启声音',
  'settings.master': '总音量',
  'settings.music': '音乐',
  'settings.effects': '音效',
  'settings.profile': '个人资料与记录',
  'settings.paytable': '赔付表',
  'settings.about': '关于',
  'settings.note': '仅限虚拟演示积分，无充值、提现或真钱投注。',
  'game.settings': '设置',
  'game.mute': '静音',
  'game.unmute': '取消静音',
  'game.paytable': '赔付表',

  'paytable.title': '赔付表',
  'paytable.lead': '按当前投注显示每条连线的赔付积分（按匹配卷轴数），连锁倍数另行叠加。',
  'paytable.bet': '投注',
  'paytable.symbol': '符号',
  'paytable.reels': '{count} 列',
  'paytable.failed': '无法加载赔付表，API 是否已启动？',
  'paytable.rounding': '赢取金额合计后向下取整为整数积分。',

  'about.title': '关于麻将王朝',
  'about.lead':
    '一座神秘的中国古典风格麻将宫殿，由黄金巨龙掌控命运。这是一个全栈浏览器演示：所有结果由服务器决定，浏览器只负责播放动画。',
  'about.howTo': '玩法说明',
  'about.ways':
    '多路赢法。|从最左侧卷轴开始，在连续 3 列或更多列上匹配同一符号即可获胜，每列中每个匹配的牌都会增加赢法数量。',
  'about.cascades':
    '连锁消除。|获胜的牌消失，其余牌下落，新牌补入。每次连续消除都会提升倍数（{ladder}）。',
  'about.dragon':
    '龙运。|每次获胜的连锁都会充能龙运条，满 100% 时黄金巨龙横扫棋盘，将 3–6 张牌变为百搭。',
  'about.wilds': '黄金百搭|可替代所有普通符号（不可替代莲花）。',
  'about.wildReel': '百搭卷轴重转。|当黄金百搭出现时，其所在整列可能锁定为百搭，其余卷轴重转一次。',
  'about.free':
    '免费旋转。|任意位置出现 3 个或更多莲花散布即可触发。{awards}。免费旋转使用更高的倍数（{ladder}），刷新页面也不会丢失进度。',
  'about.lotus': '{min}{plus} 个莲花 = {spins} 次',

  'profile.balance': '演示余额',
  'profile.totalSpins': '总旋转次数',
  'profile.totalBet': '累计投注演示积分',
  'profile.totalWon': '累计赢取演示积分',
  'profile.largest': '单次最大赢取',
  'profile.freeTriggered': '触发免费旋转次数',
  'profile.dragonTriggers': '触发龙运次数',
  'profile.member': '注册于 {date}',
  'profile.recent': '最近旋转',
  'profile.none': '还没有旋转记录，去游戏中点击旋转吧。',
  'profile.time': '时间',
  'profile.colBet': '投注',
  'profile.colWin': '赢取',
  'profile.cascades': '连锁',
  'profile.colBalance': '余额',
  'profile.notes': '备注',
  'profile.tagFree': '免费旋转',
  'profile.tagAwarded': '+{count} 次免费旋转',
  'profile.tagDragon': '龙运',

  // navigation
  'nav.leaderboard': '排行榜',

  // leaderboard
  'leaderboard.title': '演示大奖榜',
  'leaderboard.lead': '所有玩家单次旋转的最高赢取。仅限虚拟演示积分，只显示用户名。',
  'leaderboard.period': '时间范围',
  'leaderboard.all': '历史总榜',
  'leaderboard.day': '最近 24 小时',
  'leaderboard.rank': '名次',
  'leaderboard.player': '玩家',
  'leaderboard.win': '赢取',
  'leaderboard.bet': '投注',
  'leaderboard.multiple': '倍数',
  'leaderboard.when': '时间',
  'leaderboard.you': '你',
  'leaderboard.free': '免费旋转',
  'leaderboard.empty': '还没有人赢取，快来抢第一！',
  'leaderboard.failed': '无法加载排行榜。',

  'symbol.circle': '筒子',
  'symbol.bamboo': '条子',
  'symbol.character': '万子',
  'symbol.five-character': '五万',
  'symbol.eight-character': '八万',
  'symbol.east-wind': '东风',
  'symbol.white-dragon': '白板',
  'symbol.green-dragon': '发财',
  'symbol.red-dragon': '红中',
  'symbol.wild-dragon': '黄金龙百搭',
  'symbol.lotus-scatter': '莲花散布',
};

export const LANGUAGES = { en, zh } as const;
export type Language = keyof typeof LANGUAGES;
