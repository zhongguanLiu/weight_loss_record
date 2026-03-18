import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Camera, Lock, Plus, Image as ImageIcon, ShieldCheck, CheckCircle2, Download, Upload, HardDrive, Activity, Settings, X, Zap, CalendarDays, Flame, Leaf, Target, Ban, Bot, Terminal } from 'lucide-react';

// ==========================================
// IndexedDB 本地数据库封装
// ==========================================
const DB_NAME = 'FitnessLocalDB';
const STORE_NAME = 'weight_logs';

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAllLogsFromDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const saveLogToDB = async (log) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(log);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

const deleteLogFromDB = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

// ==========================================
// 碳循环食谱数据 (原则导向：指导宏观营养素)
// ==========================================
const DIET_PLAN = {
  1: { 
    type: '低碳日 (Low Carb)', color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: Leaf,
    desc: '工作日开启，切断精碳水',
    rule: '仅允许早午摄入极少量粗粮，主攻高蛋白。',
    recommend: '鸡胸肉、水煮蛋、豆腐、大量绿叶蔬菜（菠菜/生菜）。', 
    avoid: '白米饭、面条、包子等精细碳水，及含糖饮料。' 
  },
  2: { 
    type: '低碳日 (Low Carb)', color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: Leaf,
    desc: '持续低碳，保持燃脂状态',
    rule: '控制总热量，可搭配轻度有氧（如慢跑/快走）。',
    recommend: '去皮鸡腿肉、瘦猪肉、紫薯/玉米(最多半个)。', 
    avoid: '所有精制主食、高糖水果（如香蕉、葡萄）。' 
  },
  3: { 
    type: '高碳日 (High Carb)', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: Flame,
    desc: '高强度训练日，补充糖原',
    rule: '配合大肌肉群训练（腿/背），大胆吃碳水，但要严格控油。',
    recommend: '白米饭、意大利面、燕麦、瘦牛肉、鸡肉。', 
    avoid: '高脂食物（肥肉/油炸/坚果）。高碳绝对不能配高脂！' 
  },
  4: { 
    type: '低碳日 (Low Carb)', color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: Leaf,
    desc: '消耗储备糖原，恢复脂肪代谢',
    rule: '多喝黑咖啡或茶提神，提高代谢率。',
    recommend: '鱼虾海鲜、鸡蛋、西兰花等十字花科蔬菜。', 
    avoid: '各类主食（若饥饿感强，可用一小把坚果扛饿）。' 
  },
  5: { 
    type: '低碳日 (Low Carb)', color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: Leaf,
    desc: '迎接周末，坚持深层燃脂',
    rule: '利用便利店解决战斗，尽量选择纯净食材。',
    recommend: '便利店即食鸡胸、无糖豆浆、水煮蛋、无油沙拉。', 
    avoid: '周末前的放纵冲动、各类重口味外卖夜宵。' 
  },
  6: { 
    type: '高碳日 (High Carb)', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: Flame,
    desc: '周末强训，享受碳水的快乐',
    rule: '本周第二次大循环，努力训练后享受优质主食。',
    recommend: '足量米饭/馒头、清炒少油蔬菜、优质瘦肉（牛肉）。', 
    avoid: '重油外卖（如麻辣烫、炸鸡）。碳水狂欢≠垃圾食品。' 
  },
  0: { 
    type: '无碳/休息日 (Zero)', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', icon: Zap,
    desc: '纯休息日，清空体内剩余糖原',
    rule: '碳水降至几乎为零，增加优质脂肪比例以提供能量。',
    recommend: '纯肉类(煎烤皆可)、牛油果/坚果、橄榄油、大量蔬菜。', 
    avoid: '绝对禁止：任何米面、薯类、豆类及含糖水果。' 
  },
};

// ==========================================
// 主应用组件
// ==========================================
export default function App() {
  const [logs, setLogs] = useState([]);
  const [weight, setWeight] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flipIndex, setFlipIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI 状态
  const [showSettings, setShowSettings] = useState(false);

  // 刚需状态：用户身体数据与目标
  const [targetWeight, setTargetWeight] = useState(localStorage.getItem('fitness_target_weight') || '');
  const [height, setHeight] = useState(localStorage.getItem('fitness_height') || '');

  // 隐私锁状态管理
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem('fitness_keep_unlocked') !== 'true');
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState(localStorage.getItem('fitness_pin') || '');
  const [keepUnlocked, setKeepUnlocked] = useState(localStorage.getItem('fitness_keep_unlocked') === 'true');

  // 初始化
  useEffect(() => {
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: '瘦身日记' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' }
    ];

    metaTags.forEach(({ name, content }) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = content;
    });

    const loadData = async () => {
      try {
        const data = await getAllLogsFromDB();
        const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setLogs(sortedData);
        if (sortedData.length > 0) setFlipIndex(sortedData.length - 1);
      } catch (err) {
        console.error("加载本地数据失败:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!isLocked) loadData();
    else setLoading(false);
  }, [isLocked]);

  // 日期与星期信息计算
  const todayDateObj = new Date();
  const dayOfWeek = todayDateObj.getDay(); 
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const currentDayName = weekDays[dayOfWeek];
  const currentDateStr = `${todayDateObj.getMonth() + 1}月${todayDateObj.getDate()}日`;
  const todaysPlan = DIET_PLAN[dayOfWeek];

  // 核心指标计算
  const currentWeight = logs.length > 0 ? logs[logs.length - 1].weight : null;
  const initialWeight = logs.length > 0 ? logs[0].weight : null;
  
  const bmi = (currentWeight && height) ? (currentWeight / Math.pow(height / 100, 2)).toFixed(1) : null;
  let bmiStatus = { label: '未设身高', color: 'text-slate-400', bg: 'bg-white/10' };
  if (bmi) {
    if (bmi < 18.5) bmiStatus = { label: '义体骨架', color: 'text-cyan-400', bg: 'bg-cyan-500/20' }; // 偏瘦
    else if (bmi < 24) bmiStatus = { label: '碳基精英', color: 'text-emerald-400', bg: 'bg-emerald-500/20' }; // 健康
    else if (bmi < 28) bmiStatus = { label: '重型装甲', color: 'text-orange-400', bg: 'bg-orange-500/20' }; // 超重
    else bmiStatus = { label: '巨兽机甲', color: 'text-pink-500', bg: 'bg-pink-500/20' }; // 肥胖
  }

  let progressPercent = 0;
  if (initialWeight && currentWeight && targetWeight) {
    const totalToLose = initialWeight - targetWeight;
    const lostSoFar = initialWeight - currentWeight;
    if (totalToLose > 0) {
      progressPercent = Math.max(0, Math.min(100, (lostSoFar / totalToLose) * 100));
    }
  }

  // 隐私锁与设置操作
  const handleSetPin = () => {
    if (pin.length < 4) return alert("请至少输入4位数字");
    localStorage.setItem('fitness_pin', pin);
    setSavedPin(pin);
    setIsLocked(false);
    setPin('');
  };

  const handleUnlock = () => {
    if (pin === savedPin) {
      if (keepUnlocked) localStorage.setItem('fitness_keep_unlocked', 'true');
      setIsLocked(false);
      setPin('');
    } else {
      alert("口令错误，请重试！");
      setPin('');
    }
  };

  const handleLock = () => {
    localStorage.removeItem('fitness_keep_unlocked');
    setIsLocked(true);
  };

  const saveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('fitness_target_weight', targetWeight);
    localStorage.setItem('fitness_height', height);
    setShowSettings(false);
  };

  // 数据备份与恢复
  const handleExportBackup = async () => {
    try {
      const data = await getAllLogsFromDB();
      const dataStr = JSON.stringify(data);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("导出失败：" + err.message);
    }
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm("导入备份将覆盖现有部分同名数据，是否继续？")) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!Array.isArray(importedData)) throw new Error("文件格式错误");
        
        let importedCount = 0;
        for (const log of importedData) {
          if (log.id && log.date && log.weight) {
            await saveLogToDB(log);
            importedCount++;
          }
        }
        
        const newData = await getAllLogsFromDB();
        const sortedData = newData.sort((a, b) => new Date(a.date) - new Date(b.date));
        setLogs(sortedData);
        if (sortedData.length > 0) setFlipIndex(sortedData.length - 1);
        
        alert(`成功导入 ${importedCount} 条记录！`);
      } catch (err) {
        alert("导入失败，请确保选择了正确的备份文件。");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) { 
        alert("图片太大啦，建议稍微压缩或截屏后上传哦~");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weight) return;
    setIsSubmitting(true);
    
    const newLog = {
      id: Date.now().toString(),
      weight: parseFloat(weight),
      date: new Date().toISOString().split('T')[0],
      photo: photo,
      createdAt: Date.now()
    };

    try {
      await saveLogToDB(newLog);
      const newLogs = [...logs, newLog].sort((a, b) => new Date(a.date) - new Date(b.date));
      setLogs(newLogs);
      setFlipIndex(newLogs.length - 1);
      setWeight('');
      setPhoto(null);
    } catch (err) {
      console.error("保存失败:", err);
      alert("保存失败，可能存储空间不足");
    } finally {
      setIsSubmitting(false);
    }
  };

  const photoLogs = useMemo(() => logs.filter(log => log.photo), [logs]);

  // 毒舌 AI 副官逻辑计算 (多词条随机系统)
  const systemTaunt = useMemo(() => {
    if (logs.length < 2) return "缺乏足够时间线样本。碳基生物，请尽快上传质量数据。";
    const last = logs[logs.length - 1].weight;
    const prev = logs[logs.length - 2].weight;
    const diff = last - prev;
    
    // 随机抽取函数
    const getRandomTaunt = (taunts) => taunts[Math.floor(Math.random() * taunts.length)];

    if (diff < -1) {
      return getRandomTaunt([
        "警告！质量急剧流失！干得漂亮，保持这种切割装甲的速度。",
        "检测到装甲大幅脱落。碳基生物，你的自律模块终于上线了吗？",
        "核心温度升高，巨量脂肪正在被焚烧。继续保持，机动战士！"
      ]);
    }
    if (diff < 0) {
      const absDiff = Math.abs(diff).toFixed(1);
      return getRandomTaunt([
        `成功卸载了 ${absDiff}kg 劣质缓冲层。机体机动性提升。`,
        `微小突破。${absDiff}kg 的生物废料已被排出系统。`,
        `传感器显示机体轻量化进行中（-${absDiff}kg）。别骄傲，革命尚未成功。`,
        `干得不错。系统已经将 ${absDiff}kg 的肥肉移入了回收站。`
      ]);
    }
    if (diff === 0) {
      return getRandomTaunt([
        "质量未发生波动。你是在休眠舱里躺了一天吗？",
        "数据停滞。你的新陈代谢是切换到待机模式了吗？",
        "毫无变化。建议排查昨天是否偷吃了高维度的暗物质。",
        "重力感应器没有检测到差异。今天请加大功率输出！"
      ]);
    }
    if (diff > 1) {
      return getRandomTaunt([
        "警报！探测到巨量未知物质摄入！你是在吞噬黑洞吗？",
        "严重警告：底盘承重超负荷！请立即远离任何碳水化合物补给站！",
        "系统濒临崩溃：你昨天到底塞了多少高热量废料进反应堆？"
      ]);
    }
    if (diff > 0) {
      return getRandomTaunt([
        `机体负重增加了 ${diff.toFixed(1)}kg。请停止向反应堆添加劣质燃料！`,
        `雷达显示质量反弹（+${diff.toFixed(1)}kg）。碳基生物的堕落总是如此轻易。`,
        `增重警告。你那可笑的自制力又一次被食欲击穿了防护盾。`,
        `新增 ${diff.toFixed(1)}kg 赘肉模块。系统正在考虑是否放弃对您的治疗。`
      ]);
    }
    
    return "系统正在监控你的代谢引擎。";
  }, [logs]);

  // UI 渲染逻辑
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0B1120]">
      <div className="relative flex justify-center items-center">
        <div className="absolute animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
        <div className="absolute animate-spin rounded-full h-10 w-10 border-r-2 border-l-2 border-fuchsia-500 animation-reverse"></div>
        <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
      </div>
    </div>
  );

  const DynamicBackground = () => (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#0B1120] pointer-events-none">
      <div className="absolute w-[500px] h-[500px] bg-fuchsia-600/30 rounded-full blur-[120px] mix-blend-screen animate-blob top-[-10%] left-[-10%]"></div>
      <div className="absolute w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[150px] mix-blend-screen animate-blob animation-delay-2000 top-[40%] right-[-20%]"></div>
      <div className="absolute w-[400px] h-[400px] bg-blue-600/30 rounded-full blur-[100px] mix-blend-screen animate-blob animation-delay-4000 bottom-[-20%] left-[20%]"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50"></div>
    </div>
  );

  // 首次设置密码页 & 解锁页保持不变...
  if (!savedPin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <DynamicBackground />
        <div className="relative z-10 w-full max-w-xs space-y-8">
          <div className="w-24 h-24 bg-white/5 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,211,238,0.2)] border border-white/10 relative">
            <div className="absolute inset-0 rounded-[2rem] border border-cyan-400/30 animate-pulse-slow"></div>
            <HardDrive className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
          </div>
          <div>
            <h2 className="text-3xl font-black mb-3 text-white tracking-widest drop-shadow-md">初始化加密</h2>
            <p className="text-cyan-100/60 text-sm leading-relaxed px-2 font-light">
              创建本地防御凭证。<br/>您的数据将被封锁在此设备内核中。
            </p>
          </div>
          <div className="w-full space-y-6">
            <input 
              type="password" inputMode="numeric" pattern="[0-9]*"
              value={pin} onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-4xl tracking-[0.4em] py-5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-inner text-white focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all outline-none font-mono"
              placeholder="••••"
            />
            <button onClick={handleSetPin} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-2xl font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)] text-lg active:scale-95 transition-transform">启动核心引擎</button>
          </div>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <DynamicBackground />
        <div className="relative z-10 w-full max-w-xs flex flex-col items-center animate-fade-in-up">
          <div className="w-24 h-24 bg-black/40 backdrop-blur-xl rounded-full mb-8 shadow-[0_0_40px_rgba(168,85,247,0.3)] border border-fuchsia-500/30 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border border-fuchsia-500/50 animate-ping opacity-50"></div>
            <ShieldCheck className="w-10 h-10 text-fuchsia-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-widest">系统锁定</h2>
          <p className="text-fuchsia-200/50 text-sm mb-10 font-mono">AWAITING AUTHORIZATION</p>
          
          <div className="w-full bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-50"></div>
            <input 
              type="password" inputMode="numeric" pattern="[0-9]*"
              value={pin} onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-4xl tracking-[0.5em] bg-transparent border-b-2 border-white/10 focus:border-fuchsia-400 text-white outline-none pb-4 font-mono transition-colors"
              placeholder="••••" autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <div className="flex items-center justify-center gap-3 mt-8 cursor-pointer group" onClick={() => setKeepUnlocked(!keepUnlocked)}>
              <div className={`w-5 h-5 rounded border border-white/30 flex items-center justify-center transition-all ${keepUnlocked ? 'bg-fuchsia-500 border-fuchsia-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]' : ''}`}>
                {keepUnlocked && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <span className="text-sm text-slate-300 font-medium select-none group-hover:text-white transition-colors">在此终端保持授权</span>
            </div>
            <button onClick={handleUnlock} className="w-full mt-8 bg-fuchsia-600/90 hover:bg-fuchsia-500 text-white py-4 rounded-xl font-bold active:scale-95 transition-all shadow-[0_0_15px_rgba(168,85,247,0.5)] tracking-widest">
              解密进入
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 酷炫主控台
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0B1120] pb-40 font-sans text-slate-200 relative overflow-x-hidden">
      
      <DynamicBackground />

      {/* 顶部导航 */}
      <div 
        className="sticky top-0 z-40 bg-[#0B1120]/80 backdrop-blur-2xl px-5 pb-4 flex items-center justify-between border-b border-white/5 shadow-lg"
        style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white text-lg tracking-wider leading-none mb-1">BODY-OS</span>
            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-[0.2em] leading-none">Metabolic Sync</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded-full transition-all"><Settings className="w-5 h-5" /></button>
          <button onClick={handleExportBackup} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded-full transition-all"><Download className="w-5 h-5" /></button>
          <label className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded-full transition-all cursor-pointer">
            <Upload className="w-5 h-5" />
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
          <div className="w-px h-5 bg-white/10 mx-1"></div>
          <button onClick={handleLock} className="p-2 text-slate-400 hover:text-fuchsia-500 hover:bg-white/5 rounded-full transition-all"><Lock className="w-5 h-5" /></button>
        </div>
      </div>

      <main className="max-w-md mx-auto p-4 space-y-6 relative z-10 animate-fade-in-up pt-6">
        
        {/* 日期及时间显示栏 */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-cyan-400" />
            <span className="text-xl font-black text-white tracking-widest">{currentDateStr}</span>
            <span className="text-sm font-bold text-slate-400 ml-1">{currentDayName}</span>
          </div>
        </div>

        {/* 毒舌 AI 副官播报栏 */}
        <div className="bg-black/40 border border-fuchsia-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500/50"></div>
          <Bot className="w-6 h-6 text-fuchsia-400 mt-0.5 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-fuchsia-500 font-mono uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
              <Terminal className="w-3 h-3" /> Sarcasm_Protocol_v2.33 <span className="text-[8px] text-fuchsia-500/60 lowercase tracking-normal ml-1">#阴阳怪气模块</span>
            </p>
            <p className="text-xs text-fuchsia-50/90 font-mono leading-relaxed">{systemTaunt}</p>
          </div>
        </div>

        {/* 1. 营养补给舱 (碳循环策略) - 新增模块 */}
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* 背景光晕装饰 */}
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-500 ${todaysPlan.bg.replace('/20', '')}`}></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10 border-b border-white/10 pb-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 font-mono tracking-widest uppercase">
              <todaysPlan.icon className={`w-4 h-4 ${todaysPlan.color}`} /> Nutrition Plan
            </h3>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 tracking-widest font-mono ${todaysPlan.bg} ${todaysPlan.color}`}>
              {todaysPlan.type}
            </span>
          </div>

          <div className="relative z-10 space-y-4">
            <p className="text-xs text-slate-400 font-medium italic mb-2">"{todaysPlan.desc}"</p>
            
            {/* 核心原则 */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 font-mono">Core Rule</p>
                <p className="text-sm font-bold text-white leading-relaxed">{todaysPlan.rule}</p>
              </div>
            </div>

            {/* 推荐摄入 */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 font-mono">Focus On</p>
                <p className="text-sm font-bold text-emerald-50 leading-relaxed">{todaysPlan.recommend}</p>
              </div>
            </div>

            {/* 避免摄入 */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 font-mono">Avoid</p>
                <p className="text-sm font-bold text-pink-50/90 leading-relaxed">{todaysPlan.avoid}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 核心面板：发光数字 */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="flex justify-between items-end mb-6 relative z-10">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 font-mono">Current Mass</p>
              <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {currentWeight ? currentWeight : '--'}
              </h1>
            </div>
            <div className="text-right bg-black/30 backdrop-blur-md border border-white/5 px-4 py-2 rounded-2xl">
              <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1 font-mono">Target</p>
              <p className="text-xl font-bold text-white">{targetWeight || '--'} <span className="text-xs text-slate-500 font-normal">kg</span></p>
            </div>
          </div>

          <div className="mb-6 relative z-10">
            <div className="flex justify-between text-xs font-bold mb-2 font-mono">
              <span className="text-slate-500">INIT {initialWeight || '--'}</span>
              <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">{progressPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-300 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,211,238,0.8)]" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5 relative z-10">
            <div className="flex-1 bg-black/20 p-3 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-black/40 transition-colors">
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 font-mono">Chassis Class</p>
                <p className="text-lg font-black text-white">{bmi || '--'}</p>
              </div>
              {bmi && <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10 ${bmiStatus.bg} ${bmiStatus.color}`}>{bmiStatus.label}</span>}
            </div>
            <div className="flex-1 bg-black/20 p-3 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-black/40 transition-colors">
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 font-mono">Loss Total</p>
                <p className="text-xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                  -{logs.length > 1 ? (initialWeight - currentWeight).toFixed(1) : '0'} <span className="text-xs text-slate-500">kg</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 趋势图表 */}
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <h3 className="text-xs font-bold text-white mb-5 flex items-center gap-2 font-mono tracking-widest uppercase">
            <Activity className="w-4 h-4 text-fuchsia-500 animate-pulse" /> Trajectory
          </h3>
          <div className="h-44 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={logs}>
                <defs>
                  <linearGradient id="colorNeon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'}} 
                  labelStyle={{color: '#94a3b8', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase'}}
                  itemStyle={{color: '#fff', fontWeight: '900', fontSize: '16px'}}
                  labelFormatter={(v) => `T:${v}`} 
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#d946ef" 
                  strokeWidth={4} 
                  fill="url(#colorNeon)" 
                  activeDot={{ r: 6, fill: '#0f172a', stroke: '#d946ef', strokeWidth: 3, style: {filter: 'drop-shadow(0px 0px 8px rgba(217,70,239,0.8))'} }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. 蜕变时光机 */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 font-mono tracking-widest uppercase">
              <Camera className="w-4 h-4 text-emerald-400" /> Visual Log
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-mono">{photoLogs.length} Frames</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full aspect-[4/5] bg-black/60 rounded-2xl overflow-hidden mb-5 relative border border-white/5 shadow-inner">
              {photoLogs.length > 0 ? (
                <>
                  <img src={photoLogs[flipIndex].photo} className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-300" alt="progress" />
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30"></div>
                  
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end bg-black/70 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase font-mono tracking-wider">Stamp</p>
                      <p className="text-sm font-bold text-white font-mono">{photoLogs[flipIndex].date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 font-bold uppercase font-mono tracking-wider">Mass</p>
                      <p className="text-xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">{photoLogs[flipIndex].weight}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 text-center relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20"></div>
                  <ImageIcon className="w-12 h-12 mb-3 text-slate-700 relative z-10" />
                  <p className="text-sm font-medium text-slate-500 font-mono relative z-10">NO SIGNAL<br/><span className="text-[10px] font-normal mt-2 block tracking-widest uppercase">Upload image to activate</span></p>
                </div>
              )}
            </div>
            <div className="w-full px-2 group">
              <input type="range" min="0" max={Math.max(0, photoLogs.length - 1)} value={flipIndex} onChange={(e) => setFlipIndex(parseInt(e.target.value))} disabled={photoLogs.length === 0} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-2 outline-none focus:ring-2 focus:ring-emerald-500/50" />
              <div className="flex justify-between text-[9px] text-slate-500 font-bold font-mono tracking-widest uppercase">
                <span>Start</span><span className="text-emerald-500/50">Slide</span><span>Now</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 底部悬浮打卡栏 */}
      <div 
        className="fixed left-4 right-4 z-40 max-w-md mx-auto"
        style={{ bottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
      >
        <form onSubmit={handleSubmit} className="bg-slate-900/80 backdrop-blur-2xl p-2 pl-6 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex items-center gap-2 border border-white/10">
          <div className="flex-1 flex items-center">
            <input type="number" step="0.1" required inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="ENTER DATA" className="w-full bg-transparent border-none py-2 text-xl font-black text-white focus:ring-0 placeholder-slate-600 outline-none font-mono" />
            <span className="text-[10px] font-bold text-slate-500 mr-2 font-mono">KG</span>
          </div>
          <div className="w-px h-6 bg-white/10"></div>
          <input type="file" accept="image/*" onChange={handlePhotoChange} id="f-upload" className="hidden" />
          <label htmlFor="f-upload" className={`w-11 h-11 rounded-full transition-all cursor-pointer flex items-center justify-center flex-shrink-0 border ${photo ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'bg-black/50 text-slate-400 border-white/5 hover:text-white hover:border-white/20'}`}>
            <Camera className="w-4 h-4" />
          </label>
          <button disabled={isSubmitting} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white w-12 h-12 rounded-full active:scale-95 transition-all flex items-center justify-center flex-shrink-0 border border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.4)] ml-1">
            {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Plus className="w-6 h-6 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />}
          </button>
        </form>
      </div>

      {/* 弹窗区域 */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-up">
          <div className="bg-slate-900/90 backdrop-blur-2xl w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-[0_-10px_50px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-xl font-black text-white tracking-widest font-mono">CONFIG</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full border border-white/5 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveSettings} className="space-y-6 relative z-10">
              <div>
                <label className="block text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-2 font-mono">Target Mass (kg)</label>
                <input type="number" step="0.1" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="0.0" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] font-mono text-xl transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-2 font-mono">Height (cm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="0" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] font-mono text-xl transition-all" />
              </div>
              <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black py-4 rounded-2xl mt-4 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] tracking-widest">SAVE SYNC</button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        html { scroll-behavior: smooth; }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .animate-blob {
          animation: blob 15s infinite alternate ease-in-out;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        input[type=range] { 
          -webkit-appearance: none; 
          background: transparent; 
        }
        input[type=range]::-webkit-slider-thumb { 
          -webkit-appearance: none; 
          height: 20px; 
          width: 20px; 
          border-radius: 50%; 
          background: #10b981; 
          box-shadow: 0 0 15px rgba(16,185,129,0.8), inset 0 0 5px rgba(255,255,255,0.8); 
          cursor: pointer; 
          margin-top: -8px; 
          transition: transform 0.2s;
        }
        input[type=range]::-webkit-slider-thumb:active {
          transform: scale(1.2);
        }
        input[type=range]::-webkit-slider-runnable-track { 
          width: 100%; 
          height: 4px; 
          background: rgba(255,255,255,0.1); 
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}
