import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "../components/Toast";
import { certificates } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Badge from "../components/ui/Badge";
import { formatDateKZ } from "../utils/dateFormatter";

export default function CertificateDetail() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    loadCertificate();
  }, [certificateId]);

  const loadCertificate = async () => {
    try {
      setLoading(true);
      const data = await certificates.getById(certificateId);
      setCertificate(data);
    } catch (err) {
      toast.error(err.message || "Сертификатты жүктеу қатесі");
      navigate("/certificates");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return formatDateKZ(dateString);
  };

  const handleDownload = async () => {
    try {
      const { certificates } = await import("../api");
      const blob = await certificates.download(certificateId);
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Certificate_${certificate.certificate_number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Очищаем
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Сертификат сәтті жүктелді!");
    } catch (err) {
      toast.error(err.message || "PDF жүктеу қатесі");
      console.error("Download error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Сертификат жүктелуде..." />
      </div>
    );
  }

  if (!certificate) {
    return null;
  }

  const metadata = certificate.metadata ? (typeof certificate.metadata === 'string' ? JSON.parse(certificate.metadata) : certificate.metadata) : {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/certificates")}
            className="mb-6"
          >
            ← Сертификаттарға оралу
          </Button>

          <Card className="p-8 bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
            {/* Certificate Design */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-300 to-violet-300 bg-clip-text text-transparent">
                Сертификат
              </h1>
              <p className="text-xl text-white/70 mb-8">
                Бұл сертификат мынаны растайды
              </p>
            </div>

            <div className="border-2 border-purple-400/50 rounded-lg p-8 mb-8 bg-gradient-to-br from-purple-500/20 to-violet-500/20 backdrop-blur-sm">
              <h2 className="text-3xl font-bold text-center mb-4 text-white">
                {certificate.course_title}
              </h2>
              {certificate.test_title && (
                <p className="text-xl text-center text-purple-200 mb-6">
                  {certificate.test_title}
                </p>
              )}
              <p className="text-center text-lg mb-6 text-white">
                <span className="font-semibold">{certificate.user_name}</span> сәтті тапсырды
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center p-4 bg-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-lg">
                <div className="text-2xl font-bold text-purple-300 mb-2">
                  {metadata.score !== undefined ? `${metadata.score}%` : 'N/A'}
                </div>
                <div className="text-sm text-purple-200">Нәтиже</div>
              </div>
              <div className="text-center p-4 bg-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-lg">
                <div className="text-2xl font-bold text-purple-300 mb-2">
                  {metadata.correct_answers !== undefined 
                    ? `${metadata.correct_answers}/${metadata.total_questions}`
                    : 'N/A'}
                </div>
                <div className="text-sm text-purple-200">Дұрыс жауаптар</div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-4 bg-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-lg">
                <span className="text-purple-200">Сертификат нөмірі:</span>
                <span className="font-mono font-semibold text-white">{certificate.certificate_number}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-lg">
                <span className="text-purple-200">Берілген күні:</span>
                <span className="text-white">{formatDate(certificate.issued_at)}</span>
              </div>
              {certificate.expires_at && (
                <div className="flex justify-between items-center p-4 bg-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-lg">
                  <span className="text-purple-200">Мерзімі:</span>
                  <span className="text-white">{formatDate(certificate.expires_at)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/certificates")}
              >
                Артқа
              </Button>
              <Button
                variant="primary"
                onClick={handleDownload}
              >
                PDF жүктеу
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const url = `${window.location.origin}/certificates/verify/${certificate.certificate_number}`;
                  navigator.clipboard.writeText(url);
                  toast.success("Сілтеме буферге көшірілді!");
                }}
              >
                Сілтемені көшіру
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

