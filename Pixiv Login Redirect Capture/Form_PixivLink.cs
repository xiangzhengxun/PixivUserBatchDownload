using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Pixiv_Login_Redirect_Capture
{
    public partial class Form_PixivLink : Form
    {

        public Form_PixivLink(string[] args)
        {
            InitializeComponent();
            if (args.Length > 0)
            {
                textBox_pixivlink.Text = args[0];
            }
            string imageresPath = Environment.SystemDirectory + @"\imageres.dll";
            Icon icon = ExtractIcon.GetIcon(imageresPath, 241, false);
            if (icon != null)
                btn_CopyToClipboard.Image = icon.ToBitmap();
        }

        private void btn_CopyToClipboard_Click(object sender, EventArgs e)
        {
            Clipboard.SetText(textBox_pixivlink.Text);
        }
    }
}
