using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Diagnostics;
using Microsoft.Win32;
using System.Security.Principal;
using System.Runtime.InteropServices;

namespace Pixiv_Login_Redirect_Capture
{
    public partial class Form_Register : Form
    {
        private const string protocolName = "pixiv";
        private const string regArg = "--register";
        private const string unregArg = "--unregister";

        [DllImport("user32.dll", EntryPoint = "SendMessage")]
        public static extern int SendMessage(IntPtr hwnd, int wMsg, IntPtr wParam, IntPtr lParam);

        internal const int BCM_FIRST = 0x1600; //Normal button
        internal const int BCM_SETSHIELD = (BCM_FIRST + 0x000C); //Elevated button

        public Form_Register(string[] args)
        {
            InitializeComponent();
            if (args.Contains(regArg)) //注册
                button_register_Click(this, null);
            if (args.Contains(unregArg)) //注销
                button_unregister_Click(this, null);
            if (!IsAdministrator())
            {
                AddShieldToButton(button_register); //Important
                AddShieldToButton(button_unregister); //Important
            }
        }

        /// <summary>
        /// 注册协议
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void button_register_Click(object sender, EventArgs e)
        {
            if (!IsAdministrator())
            {
                RestartElevated(regArg);
                return;
            }
            Reg();
            refreshButtonEnable();
        }

        /// <summary>
        /// 注销协议
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void button_unregister_Click(object sender, EventArgs e)
        {
            if (!IsAdministrator())
            {
                RestartElevated(unregArg);
                return;
            }
            UnReg();
            refreshButtonEnable();
        }

        /// <summary>
        /// 注册启动项到注册表
        /// </summary>
        public static void Reg()
        {
            //注册协议名
            RegistryKey surekamKey = Registry.ClassesRoot.CreateSubKey(protocolName);
            //设置其为URL协议
            surekamKey.SetValue("URL Protocol", string.Empty);
            //创建打开命令
            RegistryKey shellKey = surekamKey.CreateSubKey("shell");
            RegistryKey openKey = shellKey.CreateSubKey("open");
            RegistryKey commandKey = openKey.CreateSubKey("command");
            //获取当前程序路径
            string exePath = Process.GetCurrentProcess().MainModule.FileName;
            commandKey.SetValue(string.Empty, $"\"{exePath}\" \"%1\"");
            surekamKey.Close();
        }

        /// <summary>
        /// 取消注册
        /// </summary>
        public static void UnReg()
        {
            //删除整个pixiv节点
            Registry.ClassesRoot.DeleteSubKeyTree(protocolName);
        }

        /// <summary>
        /// 检测是否是管理员权限
        /// </summary>
        /// <returns></returns>
        public bool IsAdministrator()
        {
            WindowsIdentity current = WindowsIdentity.GetCurrent();
            WindowsPrincipal windowsPrincipal = new WindowsPrincipal(current);
            return windowsPrincipal.IsInRole(WindowsBuiltInRole.Administrator);
        }

        /// <summary>
        /// 检测是否已经注册
        /// </summary>
        /// <returns></returns>
        public bool IsRegistered()
        {
            RegistryKey surekamKey = Registry.ClassesRoot.OpenSubKey(protocolName);
            bool registered = surekamKey != null;
            if (registered)
                surekamKey.Close();
            return registered;
        }

        /// <summary>
        /// 窗口启动时添加盾牌图标
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void Register_Load(object sender, EventArgs e)
        {
            refreshButtonEnable();
        }

        /// <summary>
        /// 刷新按钮的注册状态
        /// </summary>
        private void refreshButtonEnable()
        {
            bool reg = IsRegistered();
            button_register.Enabled = !reg;
            button_unregister.Enabled = reg;
        }

        /// <summary>
        /// 增加盾牌图标
        /// </summary>
        /// <param name="b"></param>
        static internal void AddShieldToButton(Button btn)
        {
            btn.FlatStyle = FlatStyle.System;
            SendMessage(btn.Handle, BCM_SETSHIELD, IntPtr.Zero, new IntPtr(0xFFFFFFFF));
        }

        /// <summary>
        /// 提权重新运行自身
        /// </summary>
        internal static void RestartElevated(string exearg = "")
        {
            ProcessStartInfo startInfo = new ProcessStartInfo
            {
                UseShellExecute = true,
                WorkingDirectory = Environment.CurrentDirectory,
                FileName = Application.ExecutablePath,
                Verb = "runas",
                Arguments = exearg
            };
            try
            {
                Process p = Process.Start(startInfo);
            }
            catch (Win32Exception ex)
            {
                Debug.Write(ex);
                return;
            }

            Application.Exit();
        }
    }
}
