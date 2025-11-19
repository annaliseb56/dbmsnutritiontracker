export default function NLogo({ className = "w-6 h-6", color = "#8BA887" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M4 20 L4 4 L7 2 L7 15 L17 2 L20 4 L20 20 L17 22 L17 9 L7 22 L4 20 Z"
                fill={color}
                stroke={color}
                strokeWidth="0.5"
                strokeLinejoin="miter"
            />
        </svg>
    );
} //Essentially our version of the Netflix logo