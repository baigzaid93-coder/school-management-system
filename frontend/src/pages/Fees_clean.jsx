  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading fees...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Fees</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fees</h1>
          <p className="text-gray-500">Manage student fees and payments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCalculateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm">
            <Calculator size={18} /> Calculate Monthly Fees
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
            <Plus size={18} /> Add Fee
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">From:</span>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">To:</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Class:</span>
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="">All Classes</option>
            {classGrades.map(cg => (
              <option key={cg._id} value={cg._id}>{cg.name} ({cg.code})</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <button
            onClick={() => {
              setSelectedClass('');
              setSelectedStatus('');
              setSearchQuery('');
              setDateRange({
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
              });
            }}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Showing fees from <span className="font-medium">{dateRange.startDate}</span> to <span className="font-medium">{dateRange.endDate}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg"><DollarSign className="text-blue-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Total Fees</p>
              <p className="text-xl font-bold">PKR {fees.reduce((sum, f) => sum + f.amount, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg"><Check className="text-green-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Collected</p>
              <p className="text-xl font-bold text-green-600">PKR {fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg"><DollarSign className="text-orange-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-orange-600">PKR {fees.reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg"><DollarSign className="text-red-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Records</p>
              <p className="text-xl font-bold text-red-600">{fees.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {fees.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Fees Found</h3>
            <p className="text-gray-500 mb-4">Get started by adding the first fee record</p>
            <button onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add First Fee</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedFees.map((fee) => {
                  const student = students.find(s => s._id === (fee.student?._id || fee.student));
                  const classGrade = student?.classGrade ? classGrades.find(cg => cg._id === (student.classGrade._id || student.classGrade)) : null;
                  return (
                    <tr key={fee._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs">
                          {fee.student?.studentId || student?.studentId || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{fee.student?.firstName} {fee.student?.lastName}</p>
                      </td>
                      <td className="px-6 py-4">
                        {classGrade ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            {classGrade.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">{fee.feeType}</td>
                      <td className="px-6 py-4 text-sm">PKR {fee.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-green-600">PKR {fee.paidAmount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(fee.status)}`}>{fee.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {fee.status !== 'Paid' && (
                            <button onClick={() => { setSelectedFee(fee); setPaymentData({ amount: fee.amount - fee.paidAmount, method: 'Cash', reference: '' }); setShowPaymentModal(true); }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Record Payment">
                              <DollarSign size={16} />
                            </button>
                          )}
                          <button onClick={() => handleDownloadVoucher(fee.student)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Download Voucher">
                            <FileDown size={16} />
                          </button>
                          <button onClick={() => handleEdit(fee)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(fee._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {fees.length > recordsPerPage && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                <p className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, fees.length)} of {fees.length} records
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingFee ? 'Edit Fee' : 'Add New Fee'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search by Roll No or Name..."
                    className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.student && (
                    <button
                      type="button"
                      onClick={clearStudent}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                  {searching && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
                
                {showDropdown && (
                  <div className="absolute z-[9999] w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {!studentSearch && filteredStudents.length > 0 && (
                      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                        Showing first 50 students
                      </div>
                    )}
                    {filteredStudents.length === 0 && !searching ? (
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        {studentSearch.length >= 2 ? 'No students found' : 'Type to search...'}
                      </div>
                    ) : (
                      filteredStudents.map((s) => (
                        <div
                          key={s._id}
                          onClick={() => handleStudentSelect(s)}
                          className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-b last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs">{s.studentId || '-'}</span>
                              <span className="text-gray-800">{s.firstName} {s.lastName}</span>
                            </div>
                            {s.classGrade?.name && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{s.classGrade.name}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {!formData.student && <p className="text-xs text-red-500 mt-1">Please select a student</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                  <select value={formData.feeType}
                    onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {['Tuition', 'Registration', 'Library', 'Laboratory', 'Activity', 'Transportation', 'Exam', 'Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input type="number" required step="0.01" value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" required value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <input type="text" value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2024-2025" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingFee ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Balance Due: PKR {(selectedFee.amount - (selectedFee.paidAmount || 0)).toLocaleString()}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                <input type="number" required step="0.01" value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  {['Cash', 'Card', 'Bank Transfer', 'Online'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input type="text" value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handlePayment} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {showCalculateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calculator size={22} className="text-green-600" /> Calculate Monthly Fees
              </h3>
              <button onClick={() => setShowCalculateModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
                  <input
                    type="month"
                    value={calculateData.month}
                    onChange={(e) => setCalculateData({ ...calculateData, month: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={calculateData.dueDay}
                    onChange={(e) => setCalculateData({ ...calculateData, dueDay: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Select Fee Types</span>
                    <div className="flex gap-4 text-xs">
                      <button
                        type="button"
                        onClick={selectAllFeeTypes}
                        className="text-green-600 hover:text-green-800 font-medium underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllFeeTypes}
                        className="text-red-600 hover:text-red-800 font-medium underline"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {availableFeeTypes.map((feeType, index) => (
                    <div 
                      key={feeType.id} 
                      className={`grid grid-cols-12 gap-4 items-center px-4 py-3 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${calculateData.selectedFeeTypes.includes(feeType.id) ? 'bg-green-50/30' : ''}`}
                    >
                      <div className="col-span-5 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${calculateData.selectedFeeTypes.includes(feeType.id) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-700 font-medium">{feeType.label}</span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <input
                          type="checkbox"
                          id={`fee-${feeType.id}`}
                          checked={calculateData.selectedFeeTypes.includes(feeType.id)}
                          onChange={() => toggleFeeType(feeType.id)}
                          className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="number"
                          value={calculateData.feeAmounts[feeType.id] || feeType.defaultAmount}
                          onChange={(e) => updateFeeAmount(feeType.id, e.target.value)}
                          disabled={!calculateData.selectedFeeTypes.includes(feeType.id)}
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-right"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-4 border-t border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Calculator size={16} /> Fee Summary
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-green-200/50">
                      <span className="text-green-700">Selected Month:</span>
                      <span className="font-semibold text-green-900">{calculateData.month}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-green-200/50">
                      <span className="text-green-700">Fee Types Selected:</span>
                      <span className="font-semibold text-green-900">{calculateData.selectedFeeTypes.length}</span>
                    </div>
                    {calculateData.selectedFeeTypes.length > 0 && (
                      <div className="pt-1 space-y-1.5">
                        {calculateData.selectedFeeTypes.map(type => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="text-green-600">• {type}</span>
                            <span className="text-green-800 font-medium">PKR {(calculateData.feeAmounts[type] || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-green-400">
                      <span className="text-green-800 font-bold">Total Per Student:</span>
                      <span className="text-green-900 font-bold text-lg">PKR {Object.entries(calculateData.feeAmounts)
                        .filter(([type]) => calculateData.selectedFeeTypes.includes(type))
                        .reduce((sum, [, amt]) => sum + (amt || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600">Due Date:</span>
                      <span className="text-green-700">Day {calculateData.dueDay} of {calculateData.month}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowCalculateModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCalculateMonthlyFees}
                disabled={calculating}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm transition-colors"
              >
                {calculating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Calculator size={18} /> Calculate & Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Fees;
