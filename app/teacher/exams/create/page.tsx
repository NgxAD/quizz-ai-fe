'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import examApi from '@/api/exam.api';

export default function CreateExamPage() {
  const [tab, setTab] = useState<'compose' | 'file'>('file');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    passingPercentage: '',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/zip',
        'text/plain',
      ];

      if (!allowedTypes.includes(file.type)) {
        setError('File không hỗ trợ. Vui lòng chọn: PDF, DOCX, XLSX, JPG, PNG, GIF, ZIP, TXT');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File quá lớn. Tối đa 10MB');
        return;
      }

      setUploadedFile(file);
      setError('');
      setSuccess('');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        setError('Vui lòng nhập tên đề');
        setLoading(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        duration: formData.duration ? parseInt(formData.duration) : 60,
        passingPercentage: formData.passingPercentage
          ? parseInt(formData.passingPercentage)
          : 50,
      };

      // Create exam first
      const response = await examApi.createExam(payload);
      
      // Save exam data to sessionStorage for editing
      sessionStorage.setItem('currentExam', JSON.stringify(response.data));
      sessionStorage.setItem('examQuestions', JSON.stringify([]));
      
      // Redirect to edit/add questions page
      router.push(`/teacher/exams/${response.data._id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo đề thất bại');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedFile) {
      setError('Vui lòng chọn file');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', uploadedFile);

      const response = await examApi.previewFile(formDataObj);
      if (response.data.success) {
        // Save to session storage and redirect to edit page
        sessionStorage.setItem('fileContent', response.data.rawText);
        sessionStorage.setItem(
          'extractedQuestions',
          JSON.stringify(response.data.preview),
        );
        sessionStorage.setItem(
          'examData',
          JSON.stringify({
            title: '',
            description: '',
            duration: '',
            passingPercentage: '',
          }),
        );
        
        router.push('/teacher/exams/edit-content');
      }
    } catch (err: any) {
      console.error('Error details:', err.response?.data);
      setError(
        err.response?.data?.message ||
          'Tải file thất bại. Vui lòng kiểm tra định dạng file.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Tạo đề mới</h1>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setTab('file')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              tab === 'file'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            📁 Upload file
          </button>
          <button
            onClick={() => setTab('compose')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              tab === 'compose'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            ✏️ Tự soạn đề thi
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* File Upload Tab */}
        {tab === 'file' && (
          <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📁</span>
              <h2 className="text-2xl font-bold text-gray-900">Upload file</h2>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-300 p-8">
                    <div className="text-center space-y-4">
                      <div className="text-5xl">☁️</div>
                      <div>
                        <p className="text-gray-700 font-semibold mb-2">
                          Chọn File hoặc kéo thả vào đây
                        </p>
                        <p className="text-sm text-gray-600">
                          Hỗ trợ PDF, DOCX, XLSX, TXT, JPG, PNG, GIF, ZIP (Tối đa 10MB)
                        </p>
                      </div>

                      <label className="block">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.txt"
                          className="hidden"
                        />
                        <span className="inline-block bg-blue-600 text-white px-6 py-3 rounded cursor-pointer hover:bg-blue-700 transition font-semibold">
                          Chọn File
                        </span>
                      </label>

                      {uploadedFile && (
                        <div className="mt-4 p-3 bg-white rounded border border-green-300">
                          <p className="text-sm text-gray-700 font-semibold">✓ File được chọn:</p>
                          <p className="text-sm text-blue-600 break-words font-mono mt-1">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(uploadedFile.size / 1024).toFixed(2)} KB
                          </p>
                          <button
                            type="button"
                            onClick={() => setUploadedFile(null)}
                            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <p className="font-semibold text-blue-900 text-sm">💡 Định dạng file:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-700">
                    <li>PDF, DOCX, XLSX, TXT (chính)</li>
                    <li>JPG, PNG, GIF (ảnh chứa text)</li>
                    <li>ZIP (thư mục chứa nhiều file)</li>
                    <li>Tối đa 10MB mỗi file</li>
                  </ul>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-indigo-900 text-sm">📋 Định dạng câu hỏi:</p>
                  <div className="bg-white p-3 rounded text-xs overflow-auto border border-indigo-200 text-gray-700 font-mono space-y-2">
                    <div>1. Câu hỏi 1? - A) Đáp án A - B) Đáp án B - C) Đáp án C - D) Đáp án D - Answer: A</div>
                    <div></div>
                    <div>2. Câu hỏi 2? - A) Đáp án A - B) Đáp án B - Đáp án: A</div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !uploadedFile}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? '⏳ Đang xử lý...' : '📤 Tải lên và Chỉnh sửa'}
                </button>
              </form>
            </div>
        )}

        {/* Compose Exam Tab */}
        {tab === 'compose' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">✏️</span>
              <h2 className="text-2xl font-bold text-gray-900">Tự soạn đề thi</h2>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-3"><strong>Hướng dẫn:</strong></p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                <li>Nhập tên đề</li>
                <li>Thêm các câu hỏi trắc nghiệm, điền từ hoặc phát âm</li>
                <li>Hệ thống sẽ tự động lưu và cho phép chỉnh sửa</li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/teacher/exams/compose')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              ✏️ Bắt đầu soạn đề thi →
            </button>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
