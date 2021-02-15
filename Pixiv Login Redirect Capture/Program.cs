using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Text.RegularExpressions;

namespace Pixiv_Login_Redirect_Capture
{
    static class Program
    {
        /// <summary>
        /// 应用程序的主入口点。
        /// </summary>
        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            if (args.Length > 0)
            {
                Regex regex = new Regex(@"^pixiv:\\\\");
                if (regex.IsMatch(args[0]))
                {
                    Application.Run(new PixivLink(args));
                }
                else
                {
                    Application.Run(new Register(args));
                }
            }
            else
            {
                Application.Run(new Register(args));
            }
        }
    }
}
