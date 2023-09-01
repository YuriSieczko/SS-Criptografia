import { Request, Response } from "express";
import { User } from "../models/User";
import nodemailer, { SendMailOptions } from "nodemailer";
import { Jwt } from "jsonwebtoken";
const bcrypt = require("bcrypt");

export const register = async (req: Request, res: Response) => {
  const { email, password, name, discipline } = req.body;

  if (email && password && name && discipline) {
    try {
      let hasUser = await User.findOne({ where: { email } });

      if (!hasUser) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        let newUser = await User.create({
          email,
          password: hashedPassword,
          name,
          discipline,
        });

        res
          .status(201)
          .json({ message: "Usuario cadastrado com sucesso.", newUser });
      }
    } catch (error) {
      console.error("Erro ao cadastrar usuario:", error);
      res.status(500).json({ error: "Erro interno ao processar o registro" });
    }
  } else {
    res
      .status(400)
      .json({ error: "Email, senha, nome e/ou disciplina não fornecidos." });
  }
};

export const login = async (req: Request, res: Response) => {
  if (req.body.email && req.body.password) {
    let email: string = req.body.email;
    let password: string = req.body.password;

    let user = await User.findOne({
      where: { email, password },
    });

    if (user) {
      res.json({ status: true });
      return;
    }
  }

  res.json({ status: false });
};

export const listAll = async (req: Request, res: Response) => {
  let users = await User.findAll();

  res.json({ users });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.params;

  if (!email) {
    return res.json({ error: "E-mail não fornecido." });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({ error: "Usuário não encontrado." });
    }

    // Configuração do transporte de e-mail usando Nodemailer
    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "3c06f9dbdde467",
        pass: "b338ed92a62e61",
      },
    });

    // Montando as opções do e-mail
    const mailOptions = {
      from: "seu-email@dominio.com",
      to: user.email,
      subject: "Recuperação de senha",
      text: `Sua senha é: ${user.password}`, // Enviando a senha do usuário
    };

    // Enviando o e-mail
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erro ao enviar o e-mail:", error);
        return res.json({ error: "Ocorreu um erro ao enviar o e-mail." });
      } else {
        console.log("E-mail enviado:", info.response);
        return res.json({ message: "Senha enviada por e-mail." });
      }
    });
  } catch (error) {
    console.error(error);
    return res.json({ error: "Ocorreu um erro ao processar a solicitação." });
  }
};
