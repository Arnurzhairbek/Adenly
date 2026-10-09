import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "../components/Toast";
import { certificates } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Badge from "../components/ui/Badge";
import { formatDateKZ } from "../utils/dateFormatter";

export default function Certificates() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certList, setCertList] = useState([]);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const data = await certificates.getMy();
      setCertList(data);
    } catch (err) {
      toast.error(err.message || "Сертификаттарды жүктеу қатесі");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return formatDateKZ(dateString);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Сертификаттар жүктелуде..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6 text-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/home")}
            className="mb-6"
          >
            ← Басты бетке оралу
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">Менің сертификаттарым</h1>
          <p className="text-white/70 text-lg">
            Сіздің алынған сертификаттарыңыз
          </p>
        </motion.div>

        {certList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
              <div className="text-center py-12">
                <h3 className="text-2xl font-semibold mb-2 text-white">Сертификаттар жоқ</h3>
                <p className="text-purple-200 mb-6">
                  Сіз әлі ешқандай сертификат алмағансыз. Тесттерді тапсырып, сертификаттар алыңыз!
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate("/home")}
                >
                  Курстарға өту
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certList.map((cert, index) => {
              const metadata = cert.metadata ? (typeof cert.metadata === 'string' ? JSON.parse(cert.metadata) : cert.metadata) : {};
              
              return (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col hover:scale-105 transition-transform cursor-pointer bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30"
                    onClick={() => navigate(`/certificates/${cert.id}`)}
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 text-center text-white">
                        {cert.course_title}
                      </h3>
                      {cert.test_title && (
                        <p className="text-purple-200 text-sm mb-4 text-center">
                          {cert.test_title}
                        </p>
                      )}
                      
                      <div className="space-y-2 mb-4">
                        {metadata.score !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-purple-200">Нәтиже:</span>
                            <Badge variant="success">{metadata.score}%</Badge>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-200">Берілген:</span>
                          <span className="text-white">{formatDate(cert.issued_at)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-200">Нөмірі:</span>
                          <span className="font-mono text-xs text-white">{cert.certificate_number}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-purple-400/30">
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/certificates/${cert.id}`);
                        }}
                      >
                        Көру
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

