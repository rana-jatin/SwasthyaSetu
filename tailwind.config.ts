
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				'electric-blue': '#00D4FF',
				'neon-pink': '#FF006E',
				'glass-white': 'rgba(255, 255, 255, 0.1)',
				'glass-border': 'rgba(255, 255, 255, 0.2)',
				'saffron': {
					'50': '#FEF9F2',
					'100': '#FDF2E5',
					'200': '#FAE5CC',
					'300': '#F6D199',
					'400': '#F4A460',
					'500': '#E89142',
					'600': '#D97B2A',
					'700': '#B86420',
					'800': '#944F1A',
					'900': '#7A4218'
				},
				'gold': {
					'50': '#FFFEF7',
					'100': '#FFFCEB',
					'200': '#FFF7D1',
					'300': '#FFED9F',
					'400': '#FFD700',
					'500': '#F5C842',
					'600': '#E5B429',
					'700': '#C69C1F',
					'800': '#A68119',
					'900': '#8B6A16'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'2xl': '1rem',
				'3xl': '1.5rem'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'particle-float': {
					'0%, 100%': {
						transform: 'translateY(0px) translateX(0px)',
						opacity: '0.3'
					},
					'50%': {
						transform: 'translateY(-20px) translateX(10px)',
						opacity: '0.6'
					}
				},
				'wave-ripple': {
					'0%': {
						transform: 'scale(1)',
						opacity: '0.8'
					},
					'100%': {
						transform: 'scale(4)',
						opacity: '0'
					}
				},
				'message-bubble': {
					'0%': {
						transform: 'scale(0.8) translateY(20px)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1) translateY(0)',
						opacity: '1'
					}
				},
				'pulse-glow': {
					'0%, 100%': {
						boxShadow: '0 0 5px rgba(0, 212, 255, 0.3)'
					},
					'50%': {
						boxShadow: '0 0 20px rgba(0, 212, 255, 0.6), 0 0 30px rgba(0, 212, 255, 0.4)'
					}
				},
				'pulse-gold': {
					'0%, 100%': {
						boxShadow: '0 0 5px rgba(255, 215, 0, 0.3)'
					},
					'50%': {
						boxShadow: '0 0 20px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4)'
					}
				},
				'typing-dots': {
					'0%, 60%, 100%': {
						transform: 'scale(1)',
						opacity: '0.4'
					},
					'30%': {
						transform: 'scale(1.2)',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'particle-float': 'particle-float 6s ease-in-out infinite',
				'wave-ripple': 'wave-ripple 0.6s ease-out',
				'message-bubble': 'message-bubble 0.4s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
				'typing-dots': 'typing-dots 1.4s ease-in-out infinite'
			},
			backdropBlur: {
				'xs': '2px'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
