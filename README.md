# dsh-lion-pet 🦁

把校徽里的那只元气小狮子放进 **DeepSeek Harness** 的桌宠插件。

![dsh-lion-pet 预览](docs/cover.webp)

它不是一段静态贴图：小狮子会呼吸、会自己散步、会转头看向行进方向；被拖起来会跟着鼠标晃，松手有惯性；点一下会弹跳、撒星星、说一句随机台词；右键可以点播动作、调大小、锁定位置、隐藏或叫回右下角。位置、大小和隐藏状态会记在浏览器里，下次打开还在原地。

## 功能

- **待机呼吸**：轻微的上下浮动和摆动，不抢注意力。
- **随机散步**：每隔一段时间在窗口下方溜达一小段，自动切换正面 / 侧面朝向。
- **点击回应**：摸摸头会弹跳、撒爱心和星星，并说出随机台词。
- **拖拽甩动**：按住拖动，松手保留速度，碰到窗口边缘会轻微反弹。
- **右键菜单**：摸摸头、散散步、转个圈、放大 / 缩小、锁定位置、回到右下角、隐藏。
- **隐藏与唤醒**：隐藏后右下角留一个圆形小头像，点一下就能叫回来。
- **记忆**：位置、大小、锁定和隐藏状态存进 `localStorage`，刷新后保持。
- **不打扰**：纯前端 overlay，不调用模型、不写会话、不产生 token 费用；`pointer-events` 只落在小狮子身上。
- **无障碍**：小狮子可聚焦，Enter / 空格摸摸头，`M` 或菜单键打开右键菜单，Esc 关闭菜单。

## 安装

### 从 GitHub 克隆

```bash
git clone https://github.com/rumpen233/dsh-lion-pet.git
dsh plugin --profile desktop add file:<克隆目录的绝对路径>
```

例如 Windows 下：

```bash
dsh plugin --profile desktop add file:C:\Users\you\dsh-lion-pet
```

### 从本地目录安装（推荐）

```bash
dsh plugin --profile desktop add file:C:\path\to\dsh-lion-pet
```

安装后如果当前 profile 启用了 HMR，插件会热加载；否则重启 DSH 后生效。也可以在 DSH 的「插件」页选择「安装第三方插件」，填入本地目录的绝对路径。

### 手动安装

1. 把整个 `dsh-lion-pet` 目录复制到：

   ```text
   $DSH_HOME/profiles/desktop/node_modules/dsh-lion-pet
   ```

2. 在 profile 的 `package.json` 里加入依赖和组合包：

   ```json
   {
     "dependencies": {
       "dsh-lion-pet": "1.0.0"
     },
     "dsh": {
       "profile": {
         "bundles": ["dsh-lion-pet"]
       }
     }
   }
   ```

3. 重启 DSH。

## 使用

| 操作 | 效果 |
| --- | --- |
| 单击小狮子 | 摸摸头：弹跳、撒星星、随机台词 |
| 按住拖动 | 搬家；松手有惯性，碰到边缘会反弹 |
| 右键 / 菜单键 | 打开动作菜单 |
| 滚轮？ | 不拦截页面滚动；请用菜单调大小 |
| 隐藏后点右下角头像 | 唤醒小狮子 |

## 配置

当前版本把偏好保存在浏览器 `localStorage` 的 `dsh-lion-pet:v4` 键里：

```json
{
  "x": 1052,
  "y": 364,
  "size": 200,
  "hidden": false,
  "locked": false,
  "positioned": true
}
```

想恢复默认，右键菜单选择「回到右下角」，或在 DevTools 里删除这个键后刷新页面。

## 素材

`assets/lion-front.webp` 与 `assets/lion-side.webp` 来自用户提供的校徽插画，经过抠图和白色贴纸描边处理；`assets/icon.png` 为插件列表头像。请在使用和再分发时遵守原图权利人的要求。

## 开发

```bash
# 重新把两张 webp 内联进 lib/client.js
node scripts/build.mjs

# 语法检查
node --check lib/client.js
```

源码在 `src/client.template.js`，构建脚本把 `__LION_FRONT__` / `__LION_SIDE__` 替换成 base64 data URL。浏览器半侧是纯 DOM + Shadow DOM，不依赖 React，避免与宿主 UI 的样式和版本耦合。

## 卸载

```bash
dsh plugin --profile desktop remove dsh-lion-pet
```

再从 profile 的 `dsh.profile.bundles` 里删掉 `dsh-lion-pet`，刷新页面。

## 许可证

- **代码**（`src/`、`lib/`、`scripts/` 及文档）：[MIT](LICENSE)
- **校徽与小狮子插画**（`assets/`、`docs/`）：版权归原权利人所有，仅用于非商业展示与个人使用，**不在 MIT 授权范围内**。详见 [NOTICE](NOTICE)。

如果原图权利人不希望该素材出现在公开仓库中，请开 issue，会及时移除。

