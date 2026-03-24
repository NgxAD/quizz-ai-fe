'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import AIChat from '@/components/AIChat';
import examApi from '@/api/exam.api';

export default function CreateExamPage() {
  const [tab, setTab] = useState<'compose' | 'file' | 'ai'>('file');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    passingPercentage: '',
    type: 'exercise',
  });
  const [fileFormData, setFileFormData] = useState({
    title: '',
    description: '',
    duration: '60',
    passingPercentage: '70',
    numberOfQuestions: '40',
    numberOfAnswersPerQuestion: '4',
    type: 'exercise',
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
        type: formData.type as 'exercise' | 'test',
      };

      // Create exam first
      const response = await examApi.createExam(payload);
      
      // Save exam data to sessionStorage for editing
      sessionStorage.setItem('currentExam', JSON.stringify(response.data));
      sessionStorage.setItem('examQuestions', JSON.stringify([]));
      
      // Redirect to compose questions page
      router.push(`/teacher/exams/${response.data._id}/compose-questions`);
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

    if (!fileFormData.title.trim()) {
      setError('Vui lòng nhập tên đề');
      return;
    }

    const numberOfQuestions = parseInt(fileFormData.numberOfQuestions) || 0;
    const numberOfAnswersPerQuestion = parseInt(fileFormData.numberOfAnswersPerQuestion) || 0;

    if (numberOfQuestions <= 0) {
      setError('Số câu hỏi phải lớn hơn 0');
      return;
    }

    if (numberOfAnswersPerQuestion < 2 || numberOfAnswersPerQuestion > 10) {
      setError('Số đáp án phải từ 2 đến 10');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', uploadedFile);
      formDataObj.append('title', fileFormData.title);
      formDataObj.append('description', fileFormData.description);
      formDataObj.append('duration', fileFormData.duration);
      formDataObj.append('passingPercentage', fileFormData.passingPercentage);
      formDataObj.append('numberOfQuestions', fileFormData.numberOfQuestions);
      formDataObj.append('numberOfAnswersPerQuestion', fileFormData.numberOfAnswersPerQuestion);
      formDataObj.append('type', fileFormData.type);

      const response = await examApi.uploadAndCreateStructure(formDataObj);
      if (response.data) {
        // Redirect to edit page để giáo viên chọn đáp án
        router.push(`/teacher/exams/${response.data._id}/edit`);
      }
    } catch (err: any) {
      console.error('Upload error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err,
      });
      setError(
        err.response?.data?.message ||
          err.message ||
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
          <button
            onClick={() => setTab('ai')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              tab === 'ai'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            🤖 Tạo đề bằng AI
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
              {/* File Upload Section */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Tệp đề thi <span className="text-red-500">*</span>
                </label>
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
              </div>

              {/* Exam Info Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Tên đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fileFormData.title}
                    onChange={(e) =>
                      setFileFormData({ ...fileFormData, title: e.target.value })
                    }
                    placeholder="Nhập tên đề"
                    className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Mô tả
                  </label>
                  <input
                    type="text"
                    value={fileFormData.description}
                    onChange={(e) =>
                      setFileFormData({ ...fileFormData, description: e.target.value })
                    }
                    placeholder="Mô tả (tùy chọn)"
                    className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Số lượng câu hỏi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={fileFormData.numberOfQuestions}
                    onChange={(e) =>
                      setFileFormData({ ...fileFormData, numberOfQuestions: e.target.value })
                    }
                    placeholder="40"
                    min="1"
                    max="100"
                    className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Số đáp án mỗi câu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={fileFormData.numberOfAnswersPerQuestion}
                    onChange={(e) =>
                      setFileFormData({ ...fileFormData, numberOfAnswersPerQuestion: e.target.value })
                    }
                    placeholder="4"
                    min="2"
                    max="10"
                    className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Thời gian (phút)
                  </label>
                  <input
                    type="number"
                    value={fileFormData.duration}
                    onChange={(e) =>
                      setFileFormData({ ...fileFormData, duration: e.target.value })
                    }
                    placeholder="60"
                    min="1"
                    className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Điểm vượt qua (%)
                  </label>
                  <input
                    type="number"
                    value={fileFormData.passingPercentage}
                    onChange={(e) =>
                      setFileFormData({ ...fileFormData, passingPercentage: e.target.value })
                    }
                    placeholder="70"
                    min="0"
                    max="100"
                    className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Loại đề
                  </label>
                  <select
                    value={fileFormData.type}
                    onChange={(e) =>
                      setFileFormData({ ...fileFormData, type: e.target.value })
                    }
                    className="w-full border rounded p-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="exercise">📝 Bài tập</option>
                    <option value="test">✅ Bài kiểm tra</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !uploadedFile}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? '⏳ Đang xử lý...' : '📤 Tải lên và Chọn đáp án'}
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

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Tên đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Nhập tên đề"
                    className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Mô tả
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Mô tả (tùy chọn)"
                    className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Thời gian (phút)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="60"
                    min="1"
                    className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Điểm vượt qua (%)
                  </label>
                  <input
                    type="number"
                    name="passingPercentage"
                    value={formData.passingPercentage}
                    onChange={handleChange}
                    placeholder="50"
                    min="0"
                    max="100"
                    className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Loại đề
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full border rounded p-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="exercise">📝 Bài tập</option>
                    <option value="test">✅ Bài kiểm tra</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? '⏳ Đang tạo...' : '✏️ Tạo đề và bắt đầu soạn'}
              </button>
            </form>
          </div>
        )}

        {/* AI Chat Tab */}
        {tab === 'ai' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🤖</span>
              <h2 className="text-2xl font-bold text-gray-900">Tạo đề bằng AI</h2>
            </div>
            <AIChat />
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
