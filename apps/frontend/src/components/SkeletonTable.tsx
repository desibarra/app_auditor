function SkeletonTable() {
    return (
        <div className="card">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                <th key={i} className="px-4 py-3">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {[1, 2, 3, 4, 5].map((row) => (
                            <tr key={row}>
                                {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                                    <td key={col} className="px-4 py-3">
                                        <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SkeletonTable;
