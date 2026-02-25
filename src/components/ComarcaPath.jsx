// src/components/ComarcaPath.jsx
import React from 'react';

const ComarcaPath = ({ id, d, fill, hovered, setHovered }) => {
    const isHovered = hovered === id;

    return (
        <path
            id={id}
            d={d}
            fill={fill}
            stroke={isHovered ? 'white' : 'var(--border-ui)'}
            strokeWidth={isHovered ? 2 : 1}
            vectorEffect="non-scaling-stroke"
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            style={{
                transition: 'all 0.2s ease',
                cursor: 'pointer'
            }}
        />
    );
};

export default ComarcaPath;