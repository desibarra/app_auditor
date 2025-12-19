function SkeletonCard() {
    return (
        <div className="card animate-pulse">
            {/* Título */}
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>

            {/* Número grande */}
            <div className="h-10 bg-gray-300 rounded w-1/2 mb-2"></div>

            {/* Texto pequeño */}
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
    );
}

export default SkeletonCard;
