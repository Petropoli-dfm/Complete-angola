import React from 'react';

// Common props for icons
interface IconProps extends React.SVGProps<SVGSVGElement> {
    active?: boolean;
}

const defaultProps = {
    className: "w-6 h-6",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
};

const activeColor = "text-brand-yellow";
const inactiveColor = "text-gray-400";

export const Spinner: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-spin"
        {...props}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ active }) => (
    <svg {...defaultProps} className={`${defaultProps.className} ${active ? activeColor : inactiveColor}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

export const InvestIcon: React.FC<IconProps> = ({ active }) => (
     <svg {...defaultProps} className={`${defaultProps.className} ${active ? activeColor : inactiveColor}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

export const TasksIcon: React.FC<IconProps> = ({ active }) => (
    <svg {...defaultProps} className={`${defaultProps.className} ${active ? activeColor : inactiveColor}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

export const GameIcon: React.FC<IconProps> = ({ active }) => (
    <svg {...defaultProps} className={`${defaultProps.className} ${active ? activeColor : inactiveColor}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const LightBulbIcon: React.FC<IconProps> = ({ active }) => (
  <svg {...defaultProps} className={`${defaultProps.className} ${active ? activeColor : inactiveColor}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-3.866 0-7 3.134-7 7 0 3.402 2.32 6.22 5.502 6.848a.75.75 0 00.996-.732V5.5a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v10.616a.75.75 0 00.996.732C16.68 16.22 19 13.402 19 10c0-3.866-3.134-7-7-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17.312A2.25 2.25 0 0112 15.062a2.25 2.25 0 012.337 2.25H9.663z" />
  </svg>
);

export const SpinIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75V2m0 20v-2.75m-7.25-7.25H2m20 0h-2.75M5.025 5.025l1.95 1.95m12.05 12.05l-1.95-1.95M5.025 18.975l1.95-1.95m12.05-12.05l-1.95 1.95M12 16a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
);


export const AccountIcon: React.FC<IconProps> = ({ active }) => (
    <svg {...defaultProps} className={`${defaultProps.className} ${active ? activeColor : inactiveColor}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ active }) => (
    <svg {...defaultProps} className={`${defaultProps.className} ${active ? activeColor : inactiveColor}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ active, ...props }) => (
    <svg {...defaultProps} {...props} className={`${defaultProps.className} ${active ? activeColor : inactiveColor}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120 10M20 20l-1.5-1.5A9 9 0 004 14" />
    </svg>
);

export const FullscreenIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4m-4 12v4h4m-12-4v4H4" />
    </svg>
);

export const ArrowDownCircleIcon: React.FC<IconProps> = ({ active, ...props }) => (
    <svg {...defaultProps} {...props} className={`${defaultProps.className} ${active ? activeColor : inactiveColor}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
    </svg>
);

export const ArrowUpCircleIcon: React.FC<IconProps> = ({ active, ...props }) => (
    <svg {...defaultProps} {...props} className={`${defaultProps.className} ${active ? activeColor : inactiveColor}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110-18 9 9 0 010 18z" />
    </svg>
);

export const ChatIcon: React.FC<IconProps> = (props) => (
     <svg {...defaultProps} {...props} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

export const ChartBarIcon: React.FC<IconProps> = ({ active }) => (
    <svg {...defaultProps} className={`${defaultProps.className} ${active ? activeColor : inactiveColor}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);


export const ChevronDownIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
);

export const EyeIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

export const CopyIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props} >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

export const EyeOffIcon: React.FC<IconProps> = (props) => (
     <svg {...defaultProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);