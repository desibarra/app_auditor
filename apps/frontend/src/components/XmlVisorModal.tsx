// Legacy wrapper - redirects to XmlVisorForense
import XmlVisorForense from './XmlVisorForense';

interface XmlVisorModalProps {
    uuid: string;
    onClose: () => void;
}

const XmlVisorModal: React.FC<XmlVisorModalProps> = ({ uuid, onClose }) => {
    return <XmlVisorForense uuid={uuid} onClose={onClose} />;
};

export default XmlVisorModal;
