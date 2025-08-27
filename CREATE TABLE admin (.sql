CREATE TABLE organization (
    org_ID NUMBER PRIMARY KEY,
    name VARCHAR2(100)
);

CREATE SEQUENCE org_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER org_bi
BEFORE INSERT ON organization
FOR EACH ROW
BEGIN
    IF :NEW.org_ID IS NULL THEN
        SELECT org_seq.NEXTVAL INTO :NEW.org_ID FROM dual;
    END IF;
END;
/

ALTER TABLE admin RENAME COLUMN org_ID TO organization_ID;


CREATE TABLE admin (
    admin_ID NUMBER PRIMARY KEY,
    name VARCHAR2(100),
    username VARCHAR2(50) UNIQUE,
    email VARCHAR2(100) UNIQUE,
    password VARCHAR2(100),
    phone VARCHAR2(20),
    status VARCHAR2(20),
    org_ID NUMBER,
    CONSTRAINT fk_org FOREIGN KEY (org_ID) REFERENCES organization(org_ID)
);

CREATE SEQUENCE admin_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER admin_bi
BEFORE INSERT ON admin
FOR EACH ROW
BEGIN
    IF :NEW.admin_ID IS NULL THEN
        SELECT admin_seq.NEXTVAL INTO :NEW.admin_ID FROM dual;
    END IF;
END;
/

CREATE TABLE categories (
    category_ID NUMBER PRIMARY KEY,
    name VARCHAR2(100)
);

CREATE SEQUENCE category_seq START WITH 1 INCREMENT BY 1;
CREATE OR REPLACE TRIGGER category_bi
BEFORE INSERT ON categories
FOR EACH ROW
BEGIN
    IF :NEW.category_ID IS NULL THEN
        SELECT category_seq.NEXTVAL INTO :NEW.category_ID FROM dual;
    END IF;
END;
/

CREATE TABLE payment_methods (
    payment_ID NUMBER PRIMARY KEY,
    type VARCHAR2(50)
);

CREATE SEQUENCE payment_seq START WITH 1 INCREMENT BY 1;
CREATE OR REPLACE TRIGGER payment_bi
BEFORE INSERT ON payment_methods
FOR EACH ROW
BEGIN
    IF :NEW.payment_ID IS NULL THEN
        SELECT payment_seq.NEXTVAL INTO :NEW.payment_ID FROM dual;
    END IF;
END;
/

CREATE TABLE encoders (
    encoder_ID NUMBER PRIMARY KEY,
    name VARCHAR2(100),
    username VARCHAR2(50) UNIQUE,
    email VARCHAR2(100) UNIQUE,
    password VARCHAR2(100),
    phone VARCHAR2(20),
    status VARCHAR2(20),
    organization_ID NUMBER,
    CONSTRAINT fk_encoder_org FOREIGN KEY (organization_ID) REFERENCES organization(org_ID)
);

CREATE SEQUENCE encoder_seq START WITH 1 INCREMENT BY 1;
CREATE OR REPLACE TRIGGER encoder_bi
BEFORE INSERT ON encoders
FOR EACH ROW
BEGIN
    IF :NEW.encoder_ID IS NULL THEN
        SELECT encoder_seq.NEXTVAL INTO :NEW.encoder_ID FROM dual;
    END IF;
END;
/

CREATE TABLE viewers (
    viewer_ID NUMBER PRIMARY KEY,
    name VARCHAR2(100),
    username VARCHAR2(50) UNIQUE,
    email VARCHAR2(100) UNIQUE,
    password VARCHAR2(100),
    phone VARCHAR2(20),
    status VARCHAR2(20),
    organization_ID NUMBER,
    CONSTRAINT fk_viewer_org FOREIGN KEY (organization_ID) REFERENCES organization(org_ID)
);

CREATE SEQUENCE viewer_seq START WITH 1 INCREMENT BY 1;
CREATE OR REPLACE TRIGGER viewer_bi
BEFORE INSERT ON viewers
FOR EACH ROW
BEGIN
    IF :NEW.viewer_ID IS NULL THEN
        SELECT viewer_seq.NEXTVAL INTO :NEW.viewer_ID FROM dual;
    END IF;
END;
/

-- DROP TABLE dashboard_statistics;

-- -- Dashboard_Statistics table
-- CREATE TABLE dashboard_statistics (
--     stat_ID NUMBER PRIMARY KEY,
--     data VARCHAR2(4000),
--     date TIMESTAMP,
--     organization_ID NUMBER,
--     CONSTRAINT fk_stat_org FOREIGN KEY (organization_ID) REFERENCES organization(org_ID)
-- );
-- CREATE SEQUENCE stat_seq START WITH 1 INCREMENT BY 1;

-- CREATE OR REPLACE TRIGGER stat_bi
-- BEFORE INSERT ON dashboard_statistics
-- FOR EACH ROW
-- BEGIN
--     IF :NEW.stat_ID IS NULL THEN
--         SELECT stat_seq.NEXTVAL INTO :NEW.stat_ID FROM dual;
--     END IF;
-- END;
-- /

-- SELECT table_name FROM user_tables WHERE table_name = 'ORGANIZATION';



-- CREATE TABLE audit_logs (
--     log_ID NUMBER PRIMARY KEY,
--     date TIMESTAMP,
--     description VARCHAR2(4000),
--     admin_ID NUMBER,
--     encoder_ID NUMBER,
--     category_ID NUMBER,
--     CONSTRAINT fk_log_admin FOREIGN KEY (admin_ID) REFERENCES admin(admin_ID),
--     CONSTRAINT fk_log_encoder FOREIGN KEY (encoder_ID) REFERENCES encoders(encoder_ID),
--     CONSTRAINT fk_log_category FOREIGN KEY (category_ID) REFERENCES categories(category_ID)
-- );

-- CREATE SEQUENCE log_seq START WITH 1 INCREMENT BY 1;
-- CREATE OR REPLACE TRIGGER log_bi
-- BEFORE INSERT ON audit_logs
-- FOR EACH ROW
-- BEGIN
--     IF :NEW.log_ID IS NULL THEN
--         SELECT log_seq.NEXTVAL INTO :NEW.log_ID FROM dual;
--     END IF;
-- END;
-- /

-- CREATE TABLE receipts (
--     receipt_ID NUMBER PRIMARY KEY,
--     date TIMESTAMP,
--     amount NUMBER(12,2),
--     encoder_ID NUMBER,
--     viewer_ID NUMBER,
--     organization_ID NUMBER,
--     category_ID NUMBER,
--     payment_ID NUMBER,
--     CONSTRAINT fk_receipt_encoder FOREIGN KEY (encoder_ID) REFERENCES encoders(encoder_ID),
--     CONSTRAINT fk_receipt_viewer FOREIGN KEY (viewer_ID) REFERENCES viewers(viewer_ID),
--     CONSTRAINT fk_receipt_org FOREIGN KEY (organization_ID) REFERENCES organization(org_ID),
--     CONSTRAINT fk_receipt_category FOREIGN KEY (category_ID) REFERENCES categories(category_ID),
--     CONSTRAINT fk_receipt_payment FOREIGN KEY (payment_ID) REFERENCES payment_methods(payment_ID)
-- );

-- CREATE SEQUENCE receipt_seq START WITH 1 INCREMENT BY 1;
-- CREATE OR REPLACE TRIGGER receipt_bi
-- BEFORE INSERT ON receipts
-- FOR EACH ROW
-- BEGIN
--     IF :NEW.receipt_ID IS NULL THEN
--         SELECT receipt_seq.NEXTVAL INTO :NEW.receipt_ID FROM dual;
--     END IF;
-- END;
-- /

-- CREATE TABLE receipt_verifications (
--     verification_ID NUMBER PRIMARY KEY,
--     is_verified NUMBER(1),
--     receipt_ID NUMBER,
--     admin_ID NUMBER,
--     CONSTRAINT fk_verification_receipt FOREIGN KEY (receipt_ID) REFERENCES receipts(receipt_ID),
--     CONSTRAINT fk_verification_admin FOREIGN KEY (admin_ID) REFERENCES admin(admin_ID)
-- );

-- CREATE SEQUENCE verification_seq START WITH 1 INCREMENT BY 1;
-- CREATE OR REPLACE TRIGGER verification_bi
-- BEFORE INSERT ON receipt_verifications
-- FOR EACH ROW
-- BEGIN
--     IF :NEW.verification_ID IS NULL THEN
--         SELECT verification_seq.NEXTVAL INTO :NEW.verification_ID FROM dual;
--     END IF;
-- END;
-- /

-- CREATE TABLE transactions (
--     transaction_ID NUMBER PRIMARY KEY,
--     date TIMESTAMP,
--     amount NUMBER(12,2),
--     receipt_ID NUMBER,
--     encoder_ID NUMBER,
--     organization_ID NUMBER,
--     CONSTRAINT fk_transaction_receipt FOREIGN KEY (receipt_ID) REFERENCES receipts(receipt_ID),
--     CONSTRAINT fk_transaction_encoder FOREIGN KEY (encoder_ID) REFERENCES encoders(encoder_ID),
--     CONSTRAINT fk_transaction_org FOREIGN KEY (organization_ID) REFERENCES organization(org_ID)
-- );

-- CREATE SEQUENCE transaction_seq START WITH 1 INCREMENT BY 1;
-- CREATE OR REPLACE TRIGGER transaction_bi
-- BEFORE INSERT ON transactions
-- FOR EACH ROW
-- BEGIN
--     IF :NEW.transaction_ID IS NULL THEN
--         SELECT transaction_seq.NEXTVAL INTO :NEW.transaction_ID FROM dual;
--     END IF;
-- END;
-- /
