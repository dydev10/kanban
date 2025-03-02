module.exports = {
  theme: {
    extend: {
      animation: {
        'gradient-move': 'gradientBG 5s ease infinite',
      },
      keyframes: {
        gradientBG: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      },
      backgroundSize: {
        '200%': '200% 200%',
      }
    }
  }
}