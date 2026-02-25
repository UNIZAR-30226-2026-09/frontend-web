// src/components/ComarcaPath.jsx
import React from 'react';

const ComarcaPath = ({ id, d, fill, hovered, setHovered }) => {
    const isHovered = hovered === id;

    return (
        <path
            id={id}
            d={d}
            fill={fill}
            stroke={isHovered ? 'blue' : 'var(--border-ui)'}
            strokeWidth={isHovered ? 3 : 2}
            vectorEffect="non-scaling-stroke" // se usa para que al ahcer zoom se mantenga la escala
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            style={{
                cursor: 'pointer' //para que al pasar por encima salga el pointer
            }}
        />
    );
};

export default ComarcaPath;