# 🐦 Tiny Wings (Android & Web PWA Clone)

> Reengenharia reversa completa do clássico **Tiny Wings v2.4.3 (iOS)** por Andreas Illiger, reconstruído para a Web moderna (HTML5 / PWA) e compilável nativamente para **Android (.APK)**.

---

## 🎮 Mecânica & Física Reconstruída
- **Física de Colinas (Hills & Slopes):** Cálculo procedural de ondas senoidais e detecção de inclinação em tempo real (`atan(slope)`).
- **Mecânica de Voo:** Mergulho de alta aceleração nas descidas (`Space` / `Touch`) e impulso balístico nas subidas para voar sobre as nuvens.
- **Ciclo Dia / Noite:** Barra de pôr do sol progressiva com bônus de tempo ao alcançar novas ilhas.
- **Fever Mode:** Mergulhos perfeitos consecutivos ativam o modo de pontuação dobrada e efeito de rastro.
- **Trilha & Efeitos Sonoros:** Trilha sonora original (`beta_musik_4_v2.mp3`), efeitos de moedas, bônus e impulsos.

---

## 📱 Como Jogar na Web / Vercel
1. Conecte este repositório à **[Vercel](https://vercel.com)** para deploy com 1 clique (arquivo `vercel.json` configurado na raiz).
2. Ou simplesmente abra o arquivo `index.html` em qualquer navegador.

---

## 🤖 Como Baixar o APK para Android
O APK é compilado automaticamente a cada push pelo GitHub Actions:
- **Download Direto:** Acesse a pasta `/release/TinyWings.apk` ou baixe via aba de **Releases** do repositório.
