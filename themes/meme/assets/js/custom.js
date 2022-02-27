window.addEventListener("DOMContentLoaded", event => {
  if (window.L2Dwidget) {
      let lightPath = 'js/lib/live2DModel/tororo/assets/tororo.model.json';
      let darkPath = 'js/lib/live2DModel/hijiki/assets/hijiki.model.json';

      let config = {
          model: {
              jsonPath: '',       // xxx.model.json 的路径
          },
          display: {
              superSample: 1,     // 超采样等级
              width: 150,         // canvas的宽度
              height: 200,        // canvas的高度
              position: 'left',   // 显示位置：左或右
              hOffset: 0,         // canvas水平偏移
              vOffset: 0,         // canvas垂直偏移
          },
          mobile: {
              show: true,         // 是否在移动设备上显示
              scale: 1,           // 移动设备上的缩放
              motion: true,       // 移动设备是否开启重力感应
          },
          react: {
              opacityDefault: 1,  // 默认透明度
              opacityOnHover: 1,  // 鼠标移上透明度
          },
      };

      this.show = function() {
          config.model.jsonPath = isDark ? lightPath : darkPath;
          L2Dwidget.init(config);
      }

      $('.theme-switch').on('click', () => {
          this.show();
      });

      this.show();
  }
}, {once: true});
